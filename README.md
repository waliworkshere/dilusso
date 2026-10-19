# Dilusso website

Catalogue website for Dilusso: kitchen fittings, hinges, plastic cabinet joints, drawer systems, pull-out baskets, sinks, hoods, doors and complete kitchens. 15+ years, present in 8 countries: Oman, Saudi Arabia, Egypt, Turkey, Italy, Spain, China and Malaysia.

It is a static site (plain HTML, CSS and JavaScript) with no build step, so it deploys to Vercel as-is.

## Deploy on Vercel
1. In Vercel, choose **Add New → Project** and import `waliworkshere/dilusso`.
2. Framework preset: **Other**. Leave the build command empty and the output directory as the root.
3. Deploy. Every push to `main` redeploys automatically.

## Pages
The site is one page with sections opened by link: `#home`, `#products` (or `#products-hinges`, `#products-sinks`, …), `#studio`, `#global`, `#about`, `#contact`.

## Editing content
- **Products, categories, countries, contact number**: `assets/data.js`
- **Design Studio rooms and fittings lists**: `assets/app.js` (search for `ROOMS`)
- **Styles and colours**: `assets/style.css`
- **Images**: `images/photos` (kitchens and wardrobes), `images/products` (product renders), `images/rooms` (Design Studio photos), `images/brand` (logo), `images/countries` (country illustrations)

To add a product, copy one entry in `assets/data.js`, give it a new `id`, set its `cat` to a category id, and point `img` at an image in `images/`.

## Content to confirm before launch
- The email address `info@dilusso.om`
- Product specifications, which are typical values
- Photos, product renders and country illustrations are placeholders, to be replaced with Dilusso's own images
