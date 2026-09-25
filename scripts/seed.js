const mongoose = require('mongoose');
const Category = require('../models/category');
const Product = require('../models/product');

const mongoUri = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/fashionstore';

const createImage = (label, background) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100">
        <rect width="100%" height="100%" fill="${background}"/>
        <circle cx="450" cy="390" r="230" fill="#ffffff" fill-opacity=".14"/>
        <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
              fill="#ffffff" font-family="Arial, sans-serif" font-size="62" font-weight="700">${label}</text>
    </svg>`;

    return {
        data: Buffer.from(svg),
        contentType: 'image/svg+xml'
    };
};

const daysFromNow = days => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date;
};

const catalog = [
    {
        name: 'Linen Summer Dress',
        description: 'A lightweight linen dress with a relaxed silhouette for warm days.',
        category: 'Women',
        price: 8900,
        currency: 'Rs',
        quantity: 18,
        takeInMethod: true,
        discount: 30,
        promotionTitle: 'Summer Style Event',
        promotionStart: daysFromNow(-3),
        promotionEnd: daysFromNow(10),
        color: '#e76f51'
    },
    {
        name: 'Classic Oxford Shirt',
        description: 'A crisp cotton Oxford shirt designed for workdays and weekends.',
        category: 'Men',
        price: 6200,
        currency: 'Rs',
        quantity: 25,
        takeInMethod: true,
        discount: 20,
        promotionTitle: 'Wardrobe Refresh',
        promotionStart: daysFromNow(-1),
        promotionEnd: daysFromNow(14),
        color: '#457b9d'
    },
    {
        name: 'Everyday Runner',
        description: 'Cushioned trainers with breathable panels and a flexible sole.',
        category: 'Shoes',
        price: 11900,
        currency: 'Rs',
        quantity: 14,
        takeInMethod: true,
        discount: 25,
        promotionTitle: 'Move More Deal',
        promotionStart: null,
        promotionEnd: daysFromNow(7),
        color: '#264653'
    },
    {
        name: 'Mini Explorer Backpack',
        description: 'A compact water-resistant backpack with padded adjustable straps.',
        category: 'Accessories',
        price: 4800,
        currency: 'Rs',
        quantity: 32,
        takeInMethod: true,
        discount: 15,
        promotionTitle: 'Travel Light Offer',
        promotionStart: daysFromNow(-5),
        promotionEnd: daysFromNow(5),
        color: '#2a9d8f'
    },
    {
        name: 'Relaxed Denim Jacket',
        description: 'A mid-weight denim jacket with an easy relaxed fit.',
        category: 'Women',
        price: 9800,
        currency: 'Rs',
        quantity: 11,
        takeInMethod: true,
        discount: 10,
        promotionTitle: 'Coming Soon',
        promotionStart: daysFromNow(3),
        promotionEnd: daysFromNow(17),
        color: '#6d597a'
    },
    {
        name: 'Leather Card Holder',
        description: 'A slim leather card holder with six card slots.',
        category: 'Accessories',
        price: 3600,
        currency: 'Rs',
        quantity: 20,
        takeInMethod: true,
        discount: 15,
        promotionTitle: 'Past Member Offer',
        promotionStart: daysFromNow(-14),
        promotionEnd: daysFromNow(-2),
        color: '#9c6644'
    },
    {
        name: 'Essential Crew T-Shirt',
        description: 'A soft cotton crew-neck T-shirt made for daily wear.',
        category: 'Men',
        price: 2900,
        currency: 'Rs',
        quantity: 40,
        takeInMethod: true,
        discount: 0,
        promotionTitle: '',
        promotionStart: null,
        promotionEnd: null,
        color: '#f4a261'
    },
    {
        name: 'Kids Weekend Hoodie',
        description: 'A cosy zip hoodie with a brushed interior and roomy pockets.',
        category: 'Kids',
        price: 4400,
        currency: 'Rs',
        quantity: 16,
        takeInMethod: true,
        discount: 0,
        promotionTitle: '',
        promotionStart: null,
        promotionEnd: null,
        color: '#e9c46a'
    }
];

const seed = async () => {
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const categoryNames = [...new Set(catalog.map(product => product.category))];
    const categories = {};

    for (const name of categoryNames) {
        const category = await Category.findOneAndUpdate(
            {name},
            {$set: {name}},
            {new: true, upsert: true, setDefaultsOnInsert: true}
        );
        categories[name] = category._id;
    }

    for (const item of catalog) {
        const {category, color, ...product} = item;
        await Product.findOneAndUpdate(
            {name: product.name},
            {
                $set: {
                    ...product,
                    category: categories[category],
                    image: createImage(product.name, color)
                }
            },
            {new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true}
        );
    }

    console.log(`Seeded ${categoryNames.length} categories and ${catalog.length} products`);
};

seed()
    .then(() => mongoose.disconnect())
    .catch(error => {
        console.error(error);
        mongoose.disconnect().finally(() => process.exit(1));
    });
