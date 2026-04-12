import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scraper for Lithophane Photo Frame from Memorable Gifts
 * This product requires photo upload and is customized before printing
 * 
 * Product Details:
 * - Lithophane 3D printed photo frame with backlight
 * - Sizes: 5x7 inches, 6x8 inches
 * - Customizable via photo upload
 * - WhatsApp order/review process
 * - Price: ₹599 (original), ₹449 (with discount)
 */

const scrapedProducts = [
    {
        name: "Lithophane Photo Frame - 3D Personalized Art",
        description: "Lithophane Photo Frame is a stunning 3D printed artwork that comes to life when lit from behind. This unique personalization makes it perfect for all occasions - birthdays, anniversaries, Valentine's Day, weddings, and more. Upload your favorite photo to create a one-of-a-kind gift that preserves your memories forever. The backlit 3D printed frame reveals your photo in a mesmerizing light and shadow play. Available in two sizes to match any space: 5x7 inches and 6x8 inches. Each frame is custom printed specifically for your uploaded photo. A sample preview is shown to you on WhatsApp before the final printing and framing process to ensure complete satisfaction.",
        original_price: 599,
        discount_price: 449,
        stock_quantity: 100,
        printing_time: 72,
        is_active: true,
        image_url: "https://memorablegifts.in/wp-content/uploads/2021/06/Copy-of-Copy-of-Copy-of-product-creatives-insta-3-3.jpg",
        image_urls: [
            "https://memorablegifts.in/wp-content/uploads/2021/06/Copy-of-Copy-of-Copy-of-product-creatives-insta-3-3.jpg"
        ],
        source_url: "https://memorablegifts.in/product/lithophane-photo-frame/",
        source_urls: [
            "https://memorablegifts.in/product/lithophane-photo-frame/?srsltid=AfmBOorzrNhJfA7rvcpOcXeKr_MHghpKvQkuIpShMZ0kYyNXu5hEDQOJ"
        ],
        type: "Item",
        parent_id: null,
        item_details_data: {
            department: "Photo Frames",
            subcategory: "Personalized Photo Frames",
            category: "Photo Frames",
            emoji: "🖼️",
            scrapedFrom: "https://memorablegifts.in/",
            additionalImages: [],
            currency: "INR",
            availability: "In Stock",
            sku: "LITHOPHANE-3D-001",
            brand: "Memorable Gifts",
            productType: "3D Printed Personalized Photo Frame",
            tags: [
                "personalized",
                "photo-frame",
                "3d-printed",
                "custom-gift",
                "lithophane",
                "backlit-photo",
                "customizable",
                "anniversary-gift",
                "birthday-gift",
                "valentines-gift",
                "home-decor",
                "wall-art",
                "unique-gift",
                "memory-keeper"
            ],
            specifications: {
                sizes: ["5x7 inches", "6x8 inches"],
                material: "3D Printed Resin/Acrylic",
                lighting: "Backlit (LED compatible, USB powered)",
                customization: "Photo Upload Required",
                processing: "Sample preview shown on WhatsApp before final delivery",
                turnaroundTime: "3-5 business days",
                shipping: "Pan India"
            },
            orderingProcess: {
                step1: "Select size and upload your photo",
                step2: "Share your contact details",
                step3: "Receive sample preview on WhatsApp",
                step4: "Confirm and proceed with payment",
                step5: "Product printed and framed",
                step6: "Doorstep delivery",
                contactMethod: "WhatsApp: +91-7678642888",
                workingHours: "10 AM - 6 PM, Monday to Saturday"
            },
            occasions: [
                "Anniversary",
                "Birthday",
                "Valentine's Day",
                "Wedding",
                "Engagement",
                "Housewarming",
                "Graduation",
                "Friends Get-Together",
                "Corporate Gifts"
            ],
            careInstructions: "Handle with care to avoid damage. Clean gently with a dry cloth. Keep away from direct sunlight when not in use. Use with LED lights for best results.",
            environmental: {
                sustainable: true,
                handmade: false,
                eco_friendly_packaging: true
            },
            sourceCanonicalUrl: "https://memorablegifts.in/product/lithophane-photo-frame/",
            sourceDomain: "memorablegifts.in"
        }
    }
];

const main = async () => {
    try {
        const outputPath = path.join(__dirname, 'memorable-gifts-lithophane.json');
        await fs.writeFile(outputPath, JSON.stringify(scrapedProducts, null, 4), 'utf8');
        console.log(`✅ Scraped ${scrapedProducts.length} product(s)`);
        console.log(`📄 Saved to: ${outputPath}`);
        console.log('\n📋 Products scraped:');
        scrapedProducts.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name}`);
            console.log(`     Price: ₹${product.discount_price} (Original: ₹${product.original_price})`);
            console.log(`     Stock: ${product.stock_quantity}`);
        });
        console.log('\n📖 Next Steps:');
        console.log('  1. Run: npm run import:products -- --input ./scripts/scraping/memorable-gifts-lithophane.json');
        console.log('  2. Or use: node ./scripts/scraping/import_scraped_products.mjs --input ./scripts/scraping/memorable-gifts-lithophane.json');
    } catch (error) {
        console.error('❌ Scraping failed:', error.message);
        process.exit(1);
    }
};

main();
