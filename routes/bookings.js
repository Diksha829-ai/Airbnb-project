const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

// CREATE BOOKING
router.post("/", isLoggedIn, async (req, res) => {
  try {
    const { listingId, name, email, checkin, checkout } = req.body;

    if (!listingId || !name || !email || !checkin || !checkout) {
      req.flash("error", "Please fill all booking details");
      return res.redirect(`/listings/${listingId}`);
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Convert strings to Date objects
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      req.flash("error", "Check-out date must be after check-in date");
      return res.redirect(`/listings/${listingId}`);
    }

    // Calculate total price on server
    const totalPrice = nights * listing.price;

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      name,
      email,
      checkin: checkinDate,
      checkout: checkoutDate,
      totalPrice,
    });

    await booking.save();

    req.flash("success", "Booking confirmed!");
    res.redirect("/bookings");

  } catch (err) {
    console.log(err); // Log real error
    req.flash("error", "Failed to book. Try again.");
    res.redirect(`/listings/${req.body.listingId}`);
  }
});

// SHOW MY BOOKINGS
router.get("/", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("bookings", { bookings });
});

// DELETE A BOOKING
router.delete("/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/bookings");
    }

    // Only allow the user who created the booking to delete it
    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You do not have permission to delete this booking");
      return res.redirect("/bookings");
    }

    await Booking.findByIdAndDelete(id);
    req.flash("success", "Booking canceled successfully");
    res.redirect("/bookings");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to cancel booking");
    res.redirect("/bookings");
  }
});

module.exports = router;
