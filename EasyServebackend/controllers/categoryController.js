const Category = require("../models/category");

// GET all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Sort alphabetically
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories ❌", error: error.message });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required ❌" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: "Category already exists ❌" });

    const category = new Category({ name, icon });
    await category.save();

    res.json({ message: "Category created ✅", category });
  } catch (error) {
    res.status(500).json({ message: "Error creating category ❌", error: error.message });
  }
};

module.exports = { getCategories,createCategory };
