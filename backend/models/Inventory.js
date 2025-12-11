const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    inventoryId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: {
            values: ['Accessories', 'Electronics', 'Furniture', 'Printing', 'Audio', 'Office', 'Storage'],
            message: '{VALUE} is not a valid category'
        }
    },
    supplier: {
        type: String,
        required: [true, 'Supplier is required'],
        trim: true,
        maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    stock: {
        type: String,
        required: [true, 'Stock status is required'],
        enum: {
            values: ['In stock', 'Out of stock'],
            message: '{VALUE} is not a valid stock status'
        },
        default: 'In stock'
    },
    costUnit: {
        type: Number,
        required: [true, 'Cost per unit is required'],
        min: [0, 'Cost cannot be negative'],
        max: [1000000, 'Cost cannot exceed $1,000,000']
    },
    warehouse: {
        type: String,
        required: [true, 'Warehouse is required'],
        trim: true,
        uppercase: true,
        maxlength: [20, 'Warehouse code cannot exceed 20 characters']
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// create index for faster queries
InventorySchema.index({ userId: 1, lastUpdated: -1 });
InventorySchema.index({ productName: 'text', category: 'text', supplier: 'text' });

module.exports = mongoose.model('Inventory', InventorySchema);