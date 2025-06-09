# Quick Deployment Guide

This is a condensed version of the setup process for quick reference.

## 1. Create GitHub Repository

1. Create new repository named `rexrafa.github.io` (replace with your username)
2. Make it public
3. Clone to your computer

## 2. Upload Blog Files

1. Copy all blog files to your repository folder
2. Update `_config.yml` with your information:
   ```yaml
   title: "Your Blog Title"
   url: "https://yourusername.github.io"
   author: "Your Name"
   email: "your-email@example.com"
   social:
     linkedin: "your-linkedin-username"
     github: "yourusername"
   ```

## 3. Customize About Page

1. Edit `about.html`
2. Update bio, certifications, and contact links
3. Replace placeholder URLs with your actual profiles

## 4. Deploy to GitHub Pages

1. Commit and push all files to GitHub
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch: main"
4. Wait 5-10 minutes for deployment

## 5. Verify Deployment

Visit `https://yourusername.github.io` and check:
- [ ] Site loads correctly
- [ ] All pages work (Home, About, Tags, Archive)
- [ ] Search functionality works
- [ ] Social sharing buttons work

## 6. Create Your First Post

1. Copy `POST_TEMPLATE.md` as reference
2. Create new file: `_posts/2024-12-15-your-first-post.md`
3. Use this structure:
   ```yaml
   ---
   layout: post
   title: "Your Post Title"
   date: 2024-12-15 10:00:00 -0000
   tags: [AWS, DevOps, Tutorial]
   author: Rex Rafa
   excerpt: "Brief description of your post"
   ---
   
   Your content here...
   ```

## 7. Share on LinkedIn

Use this template:
```
🚀 Just launched my new tech blog!

I'll be sharing insights on AWS, DevOps, and AI twice a week. 

First post covers [topic] - check it out and let me know what you think!

#AWS #DevOps #TechBlog #CloudComputing

[Your blog URL]
```

## Need Help?

- Full documentation: `README.md`
- Post template: `POST_TEMPLATE.md`
- Jekyll docs: https://jekyllrb.com/docs/
- GitHub Pages docs: https://docs.github.com/en/pages

## File Structure Reference

```
rexrafa.github.io/
├── _config.yml          # Main configuration
├── _layouts/            # Page templates
├── _includes/           # Reusable components
├── _posts/              # Your blog posts
├── assets/              # CSS, JS, images
├── index.html           # Homepage
├── about.html           # About page
├── tags.html            # Tags page
├── archive.html         # Archive page
├── Gemfile              # Jekyll dependencies
└── README.md            # Full documentation
```

## Common Commands

```bash
# Clone repository
git clone https://github.com/yourusername/yourusername.github.io.git

# Add new files
git add .

# Commit changes
git commit -m "Add new blog post"

# Push to GitHub
git push origin main
```

That's it! Your blog should be live and ready for content.

