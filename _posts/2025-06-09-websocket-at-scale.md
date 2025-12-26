---
layout: post
title: "4 Things I Learned Managing a WebSocket Platform at Scale"
date: 2025-06-09 09:00:00 -0300
categories: Network
tags: [aws, network, DNS, EC2, websocket, scalability]
author: Rafa Oliveira
---

## Introduction

Over the past two years, I've managed a real-time platform with WebSocket applications handling more than 8 million open connections and processing over 50,000 RPS. 

In this blog post, I want to share 4 key lessons learned while managing this platform. While our infrastructure ran on Kubernetes, these insights apply to any WebSocket deployment on AWS.


---

## 1. Don't Trust the AWS EC2 "Up to" Network Bandwidth

When selecting an instance type, you might choose a `c5.2xlarge` because it meets your CPU/Memory requirements and advertises "Up to 10 Gbps" network bandwidth. However, AWS documentation clearly states:

> Instances marked with "Up to" Network Bandwidth have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis.

This means you shouldn't expect to sustain 10 Gbps for extended periods.

### Finding the Real Baseline

You can check the actual baseline bandwidth using this AWS CLI command:

```bash
aws ec2 describe-instance-types \
    --filters "Name=instance-type,Values=c5.*" \
    --query "InstanceTypes[].[InstanceType, NetworkInfo.NetworkPerformance, NetworkInfo.NetworkCards[0].BaselineBandwidthInGbps] | sort_by(@,&[2])" \
    --output table
```

This returns:
```
---------------------------------------------
|           DescribeInstanceTypes           |
+--------------+--------------------+-------+
|  c5.large    |  Up to 10 Gigabit  |  0.75 |
|  c5.xlarge   |  Up to 10 Gigabit  |  1.25 |
|  c5.2xlarge  |  Up to 10 Gigabit  |  2.5  |
|  c5.4xlarge  |  Up to 10 Gigabit  |  5.0  |
|  c5.9xlarge  |  12 Gigabit        |  12.0 |
|  c5.12xlarge |  12 Gigabit        |  12.0 |
|  c5.18xlarge |  25 Gigabit        |  25.0 |
|  c5.24xlarge |  25 Gigabit        |  25.0 |
|  c5.metal    |  25 Gigabit        |  25.0 |
+--------------+--------------------+-------+
```

Notice that a `c5.2xlarge` has a real baseline of only 2.5 Gbps instead of the advertised 10 Gbps. Choose instance types based on your actual network requirements.

💡 **Tip**: Consider the `n` instance variants (like `c5n`) which offer better network bandwidth baselines.

---

## 2. Monitor EC2 Network Throttling

Even with the right instance type, you might see packets being queued or dropped. Use `ethtool` to investigate network throttling:

```bash
$ ethtool -S eth0 | grep exceeded
    bw_in_allowance_exceeded: 5976
    bw_out_allowance_exceeded: 70727915
    pps_allowance_exceeded: 3316
    conntrack_allowance_exceeded: 0
    linklocal_allowance_exceeded: 0
```

### Understanding the Metrics

- **`bw_in_allowance_exceeded`**:  High values indicate incoming throttling
- **`bw_out_allowance_exceeded`**: High values indicate egress throttling
- **`pps_allowance_exceeded`**: Too many small packets hitting rate limits
- **`conntrack_allowance_exceeded`**: Connection tracking table full (should be 0)
- **`linklocal_allowance_exceeded`**: Link-local traffic limit exceeded (should be 0)

💡 **Tip**: Monitor these values with CloudWatch and set up alerts. Packet retransmission significantly slows down WebSocket applications.

---

## 3. Tune Conntrack for Long-Lived Connections

WebSocket applications maintain long-lived connections that can exhaust the Linux connection tracking table, causing new connections to be dropped.

### Check Current Usage

```bash
# Current tracked connections
cat /proc/sys/net/netfilter/nf_conntrack_count

# Maximum allowed connections  
cat /proc/sys/net/netfilter/nf_conntrack_max

# Usage percentage
echo "scale=2; $(cat /proc/sys/net/netfilter/nf_conntrack_count) * 100 / $(cat /proc/sys/net/netfilter/nf_conntrack_max)" | bc
```

### Increase the Limits for High-Load Environments

```bash
# For high-load WebSocket environments, increase significantly
# Rule of thumb: 4× expected concurrent connections, considering CPU cores
sudo sysctl -w net.netfilter.nf_conntrack_max=524288

# Make persistent
echo "net.netfilter.nf_conntrack_max = 524288" | sudo tee -a /etc/sysctl.conf
```

### Optimize for WebSocket Applications

```bash
# Reduce timeout for established connections (2 hours instead of 5 days)
echo "net.netfilter.nf_conntrack_tcp_timeout_established = 7200" | sudo tee -a /etc/sysctl.conf

# Optimize connection cleanup
echo "net.netfilter.nf_conntrack_tcp_timeout_time_wait = 30" | sudo tee -a /etc/sysctl.conf

# Increase hash table size for better performance with many connections
echo "net.netfilter.nf_conntrack_buckets = 65536" | sudo tee -a /etc/sysctl.conf
```

💡 **Tip**: Set `nf_conntrack_max` based on your instance's CPU cores and memory. For high-load environments, use: `(CPU cores × 16384)` as a starting point, then adjust based on actual usage and available memory.

---

## 4. Avoid Route53 DNS Resolution Limits

Each network interface can only send [1024 packets per second](https://docs.aws.amazon.com/whitepapers/latest/hybrid-cloud-dns-options-for-vpc/constraints.html#:~:text=Each%20network%20interface%20in%20an,provided%20DNS%20server%20every%20second.) to the Amazon-provided DNS server. This becomes a bottleneck for applications making frequent external API calls.

### Kubernetes Solution

Deploy [nodelocaldns](https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/) to cache DNS queries locally and reduce latency. In high-load environments, it's recommended to enable `force_tcp` to avoid issues caused by dropped or timed-out UDP packets, ensuring more reliable DNS resolution.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nodelocaldns
  namespace: kube-system
data:
  Corefile: |
    cluster.local:53 {
        errors
        cache {
            success 9984 30
            denial 9984 5
        }
        reload
        loop
        bind 169.254.20.10
        forward . __PILLAR__CLUSTER__DNS__ {
            force_tcp
        }
        prometheus :9253
        health 169.254.20.10:8080
    }
```

### EC2 Instance Solution

Set up a local DNS cache using bind9:

```bash
# Install bind9
sudo yum install -y bind bind-utils

# Configure as caching nameserver
sudo tee /etc/named.conf << EOF
options {
    listen-on port 53 { 127.0.0.1; };
    directory "/var/named";
    recursion yes;
    allow-query { localhost; };
    forwarders { 169.254.169.253; };
    forward only;
};
EOF

# Update /etc/resolv.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf

# Start and enable bind
sudo systemctl start named
sudo systemctl enable named
```

💡 **Tip**: Monitor DNS query patterns and cache hit rates to optimize your caching strategy.

---

## Conclusion

Managing WebSocket applications at scale requires understanding these AWS networking limitations:

1. **Know your real network capacity** - Don't rely on "up to" bandwidth specifications
2. **Monitor network throttling** - Use `ethtool` and set up CloudWatch alerts  
3. **Tune conntrack for long-lived connections** - Scale limits based on connection patterns
4. **Implement DNS caching** - Avoid Route53 rate limits with local DNS caching

These optimizations helped us maintain stable performance with 8M+ concurrent connections during traffic spikes. Always test these changes in staging environments that mirror your production load.

---

In my next post I'll talk about the challenges of scaling up and down this environment.

*Have you encountered similar challenges scaling WebSocket applications? Share your experiences in the comments below.*

*This blog was written by :brain: + :robot_face:*






