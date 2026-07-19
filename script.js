/*==================================================
  ARMANDO'S BARBER
  Premium Website JavaScript
==================================================*/


document.addEventListener("DOMContentLoaded", () => {



/*=================================
ACTIVE NAVIGATION
=================================*/


const currentPage = window.location.pathname.split("/").pop();


const navLinks = document.querySelectorAll(".bottom-nav a");


navLinks.forEach(link => {


    const href = link.getAttribute("href");


    if(href === currentPage){

        link.classList.add("active");

    }


});






/*=================================
SCROLL REVEAL ANIMATION
=================================*/


const revealItems = document.querySelectorAll(
`
.hero-content,
.hero-image,
.trust-bar,
.intro,
.mini-service,
.service-box,
.gallery-item,
.featured-cut,
.barber-profile,
.value-card,
.contact-card,
.hours-row,
.booking-section,
.cta
`
);



revealItems.forEach(item => {

    item.classList.add("reveal");

});



const observer = new IntersectionObserver((entries)=>{


entries.forEach(entry=>{


    if(entry.isIntersecting){

        entry.target.classList.add("active");

    }


});


},
{
    threshold:0.15
});



revealItems.forEach(item=>{

    observer.observe(item);

});







/*=================================
BUTTON PRESS EFFECT
=================================*/



const buttons = document.querySelectorAll(
"button"
);



buttons.forEach(button=>{


button.addEventListener("click",()=>{


button.classList.add("clicked");


setTimeout(()=>{

button.classList.remove("clicked");

},300);


});


});







/*=================================
WHATSAPP BOOKING
CHANGE NUMBER
=================================*/



const whatsappNumber = "27820000000";


const bookingButtons = document.querySelectorAll(
".booking-btn, .cta button, .service-cta button, .gallery-cta button, .about-cta button, .booking-section button, .service-bottom button"
);



bookingButtons.forEach(button=>{


button.addEventListener("click",()=>{


const message =
"Hi Armando's Barber, I would like to book an appointment.";



const whatsappURL =
`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;



window.open(
whatsappURL,
"_blank"
);



});


});







/*=================================
IMAGE LOADING ANIMATION
=================================*/



const images = document.querySelectorAll("img");



images.forEach(image=>{


image.addEventListener("load",()=>{


image.classList.add("loaded");


});


});







/*=================================
PREVENT DOUBLE TAP ZOOM
BETTER MOBILE EXPERIENCE
=================================*/



let lastTouchEnd = 0;


document.addEventListener(
"touchend",
function(event){


const now = new Date().getTime();


if(now - lastTouchEnd <=300){

event.preventDefault();

}


lastTouchEnd = now;


},
false
);



});