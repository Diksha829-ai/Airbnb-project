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

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      req.flash("error", "Check-out must be after check-in");
      return res.redirect(`/listings/${listingId}`);
    }

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
    console.log(err);
    req.flash("error", "Booking failed. Try again.");
    res.redirect(`/listings/${req.body.listingId}`);
  }
});

// SHOW BOOKINGS
router.get("/", isLoggedIn, async (req, res) => {
  const { q } = req.query;
  let bookings;

  if (q) {
    bookings = await Booking.find({ user: req.user._id }).populate({
      path: "listing",
      match: { title: { $regex: q, $options: "i" } },
    });
    bookings = bookings.filter(b => b.listing !== null);
  } else {
    bookings = await Booking.find({ user: req.user._id }).populate("listing");
  }

  res.render("bookings", { bookings, query: q });
});

// DELETE BOOKING
router.delete("/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);
  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }
  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "Permission denied");
    return res.redirect("/bookings");
  }
  await Booking.findByIdAndDelete(id);
  req.flash("success", "Booking canceled");
  res.redirect("/bookings");
});

module.exports = router;
