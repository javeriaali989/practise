const ServiceRequest = require("../models/serviceRequest");
const Bid = require("../models/Bid");
const User = require("../models/user");
const Booking = require("../models/booking"); // ← ADD THIS IMPORT
const Provider = require("../models/Provider");
// GET all service requests
const getServiceRequests = async (req, res) => {
  try {
    const { userId, status, requestType } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (status) {
      const statusArray = status.split(','); // "open,bidding" → ["open","bidding"]
      filter.status = { $in: statusArray };
    }
    if (requestType) filter.requestType = requestType;

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('acceptedBidId');


    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching service requests",
      error: error.message
    });
  }
};

// CREATE service request (fixed price or bidding)
const createServiceRequest = async (req, res) => {
  try {
    const {
      userId,
      userName,
      categoryId,
      categoryName,
      description,
      requestType,
      fixedAmount,
      biddingEndDate,
      minBidAmount,
      maxBidAmount,
      images
    } = req.body;
    let initialStatus = 'open'; 

    const serviceRequest = new ServiceRequest({
      userId,
      userName,
      categoryId,
      categoryName,
      description,
      requestType,
      fixedAmount: requestType === 'fixed' ? fixedAmount : null,
      biddingEndDate: requestType === 'bidding' ? biddingEndDate : null,
      minBidAmount: requestType === 'bidding' ? minBidAmount : null,
      maxBidAmount: requestType === 'bidding' ? maxBidAmount : null,
      status: initialStatus,
      images,
    });

    await serviceRequest.save();

    res.status(201).json({
      message: "Service request created successfully",
      request: serviceRequest
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating service request",
      error: error.message
    });
  }
};

// GET bids for a service request
const getBidsByRequest = async (req, res) => {
  try {
    const { serviceRequestId } = req.params;

    const bids = await Bid.find({ serviceRequestId })
      .sort({ proposedAmount: 1 })
      .populate('providerId', 'name rating image');

    res.json(bids);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching bids",
      error: error.message
    });
  }
};
const getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ServiceRequest.findById(id).populate('acceptedBidId');
    if (!request) {
      return res.status(404).json({ message: "Service request not found" });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service request", error: error.message });
  }
};
// PROVIDER places a bid
const placeBid = async (req, res) => {
  try {
    const {
      serviceRequestId,
      providerId,
      providerName,
      proposedAmount,
      note,
      estimatedTime
    } = req.body;

    const serviceRequest = await ServiceRequest.findById(serviceRequestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (serviceRequest.requestType !== 'bidding') {
      return res.status(400).json({ message: "This request is not open for bidding" });
    }

    if (serviceRequest.status !== 'open') {
      return res.status(400).json({ message: "Bidding is closed for this request" });
    }

    // Check if provider has already bid
    const existingBid = await Bid.findOne({
      serviceRequestId,
      providerId
    });

    if (existingBid) {
      return res.status(400).json({ message: "You have already placed a bid" });
    }

    const bid = new Bid({
      serviceRequestId,
      providerId,
      providerName,
      proposedAmount,
      note,
      estimatedTime
    });

    await bid.save();

    // Update service request status to bidding
    if (serviceRequest.status === 'open') {
      serviceRequest.status = 'bidding';
      await serviceRequest.save();
    }

    res.status(201).json({
      message: "Bid placed successfully",
      bid
    });
  } catch (error) {
    res.status(500).json({
      message: "Error placing bid",
      error: error.message
    });
  }
};

// USER accepts a bid
// serviceRequestController.js


// ==========================
// PROVIDER ACCEPTS BID
// ==========================
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ message: "Missing bidId" });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const request = await ServiceRequest.findById(bid.serviceRequestId);
    if (!request) return res.status(404).json({ message: "Service request not found" });

    if (request.status === "assigned")
      return res.status(400).json({ message: "Request already assigned" });

    const provider = await Provider.findById(bid.providerId);
    if (!provider) return res.status(404).json({ message: "Provider not found" });

    // Update request
    request.assignedProviderId = provider._id;
    request.assignedProviderName = provider.name;
    request.status = "assigned";
    request.finalAmount = bid.proposedAmount;
    await request.save();

    // Create booking
    const booking = new Booking({
      requestId: request._id,
      bidId: bid._id,
      userId: request.userId,
      userName: request.userName,
      providerId: provider._id,
      providerName: provider.name,
      agreedPrice: bid.proposedAmount,
      status: "confirmed",
    });
    await booking.save();

    res.json({
      message: "Bid accepted and booking created successfully",
      request,
      booking,
    });
  } catch (error) {
    console.error("Accept Bid Error:", error);
    res.status(500).json({ message: "Error accepting bid", error: error.message });
  }
};


// GET provider's bids
const getProviderBids = async (req, res) => {
  try {
    const { providerId } = req.params;

    const bids = await Bid.find({ providerId })
      .sort({ createdAt: -1 })
      .populate('serviceRequestId');

    res.json(bids);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching provider bids",
      error: error.message
    });
  }
};

module.exports = {
  getServiceRequests,
  createServiceRequest,
  getServiceRequestById,
  getBidsByRequest,
  placeBid,
  acceptBid,
  getProviderBids
};