const mongoose = require('mongoose');

exports.deleteDatabase = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.collections();
        await Promise.all(collections.map(col => col.deleteMany({})));
        res.json({ message: 'All collections have been wiped successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
