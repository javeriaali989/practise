const Provider = require("../models/provider");
const ServiceRequest = require("../models/serviceRequest");

/* ==================== PROVIDER OPERATIONS ==================== */
// GET all providers with optional filters
const getProviders = async (req, res) => {
  try {
    const { categoryId, area, price } = req.query;
    const filter = {};

    if (categoryId) filter.categoryId = categoryId;
    if (area) filter.area = area;
    if (price) filter.price = { $lte: Number(price) };

    const providers = await Provider.find(filter);
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching providers ❌", error: error.message });
  }
};

// GET single provider by ID
const getProviderById = async (req, res) => {
  try {
    const providerId = req.params.id;
    if (!providerId) return res.status(400).json({ message: "Provider ID required ❌" });

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ message: "Provider not found ❌" });

    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: "Error fetching provider ❌", error: error.message });
  }
};

/* ==================== PROVIDER ASSIGNED REQUESTS ==================== */
// GET all requests assigned to a provider
const getAssignedRequests = async (req, res) => {
  try {
    const providerId = req.query.providerId;
    if (!providerId) return res.status(400).json({ message: "Provider ID required ❌" });

    const requests = await ServiceRequest.find({ assignedProviderId: providerId });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned requests ❌", error: error.message });
  }
};

// UPDATE request status by provider (in-progress, completed, cancelled)
const updateRequestStatusByProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await ServiceRequest.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: "Request status updated ✅", request: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating request status ❌", error: error.message });
  }
};

module.exports = {
  getProviders,
  getProviderById,
  getAssignedRequests,
  updateRequestStatusByProvider,
};
