const express = require("express");
const { getCategories,createCategory } = require("../controllers/categoryController");

const router = express.Router();

// Only GET route, no create/update/delete
router.get("/", getCategories);
router.post("/", createCategory);
module.exports = router;
