
const express = require("express");
const {
  getBookings,
  createBooking,
  updateBookingStatus,
  getBookingById,
  getBookingMessages,   // ← Import
  sendBookingMessage,
  startService,
  providerCompleteService,
  userConfirmBooking, // ← Import
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getBookings);                 // GET bookings (user or provider)
router.post("/", createBooking);             // CREATE booking
router.put("/:id/status", updateBookingStatus); // UPDATE booking status
router.get("/:id", getBookingById);
router.get("/:id/messages", getBookingMessages);      // ← Add GET messages
router.post("/:id/messages", sendBookingMessage);
router.post("/:id/start", startService);              // Provider starts
router.post("/:id/provider-complete", providerCompleteService); // Provider completes
// router.post('/:id/user-confirm', userConfirmBooking);
// router.post("/:bookingId/confirm-release", userConfirmBooking);

// ⭐ Single unified route for confirm & release
router.post("/:id/confirm-release", userConfirmBooking);

module.exports = router;
