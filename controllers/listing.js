

const Listing=require("../models/listing.js");


module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm=(req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // ✅ SAFE MAP DATA
  let hasGeometry = false;
  let lat = 20; // default India
  let lng = 77;

  if (
    listing.geometry &&
    listing.geometry.coordinates &&
    listing.geometry.coordinates.length === 2
  ) {
    lng = listing.geometry.coordinates[0];
    lat = listing.geometry.coordinates[1];
    hasGeometry = true;
  }

  res.render("listings/show.ejs", {
    listing,
    hasGeometry,
    lat,
    lng,
  });
};



module.exports.createListing = async (req, res, next) => {
  const { lat, lng } = req.body; // ✅ only here, inside the function

  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // Add geometry only if lat/lng exist
  if (lat && lng) {
    newListing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
  }

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};




module.exports.renderEditForm=(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
    if(!listing){
    req.flash("error","Listing you requested for does not exists !");
    return res.redirect("/listings");
  }
  let originalImageUrl=listing.image.url;
  originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
  res.render("listings/edit.ejs", { listing ,originalImageUrl});
});

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body; // ✅ inside the function

  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (req.file) {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  if (lat && lng) {
    listing.geometry = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing=(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
    req.flash("success","listing deleted!");

  res.redirect("/listings");
});
