async function toggleLike(event, btn) {
  event.preventDefault();
  event.stopPropagation();

  const listingId = btn.dataset.id;
  const icon = btn.querySelector("i");

  const res = await fetch(`/listings/${listingId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();

  if (data.liked) {
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid", "text-danger");
  } else {
    icon.classList.remove("fa-solid", "text-danger");
    icon.classList.add("fa-regular");
  }

  document.getElementById("like-count").innerText = data.totalLikes;
}
