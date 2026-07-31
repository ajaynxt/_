# AJAYNXT Digital Atelier v12

Complete UI/UX rebuild from the uploaded AJAYNXT repository.

## Preserved
- Existing Ajay portraits and identity assets
- 10 film projects, including the packaged local MP4 and Google Drive previews
- Photo editing portfolio
- Instagram, LinkedIn, Threads, Facebook, GitHub, WhatsApp, email and phone links
- Firebase enquiry integration and private admin files
- Portfolio PDF, Firebase rules and deployment files

## New experience
- Four automatic colour atmospheres alternating between dark and light
- Manual Auto → Dark → Light control
- Three.js interactive hero with fallback
- GSAP progressive-enhancement motion
- Actual website screenshots requested from each live project link using a screenshot endpoint
- Local fallback visuals when a live screenshot cannot load
- Rebuilt website, film, social, photo, services, process, About and contact sections
- Responsive mobile CTA, reduced-motion support, SEO, JSON-LD and PWA manifest

## Live screenshot note
Project cards request images from `image.thum.io` using the actual website URLs. This means the portfolio shows website captures instead of generic artwork. The screenshot service requires internet access and may cache captures. Each card has a packaged fallback.

## Deployment
Upload extracted files to the root of `https://github.com/ajaynxt/_.git`, enable GitHub Pages from `main / root`, and keep the custom domain `ajaynxt.com`.
