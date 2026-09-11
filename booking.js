/*==================================================
  ARMANDO'S BARBER
  SUPABASE BOOKING SYSTEM
==================================================*/


/*==================================================
  SUPABASE CONNECTION
==================================================*/

const SUPABASE_URL =
    "https://yuvorzvhnjsycmigueom.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_4oNuPNPr7a8e5mrTg7xgQA_rG4vK8Df";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/*==================================================
  SERVICES
==================================================*/

const SERVICES = {

    "Classic Haircut": 100,

    "Fade": 120,

    "Haircut & Beard": 150,

    "Beard Trim": 70,

    "Line-Up": 60,

    "Kids Haircut": 80,

    "Haircut & Wash": 140,

    "Full Grooming": 180

};


/*==================================================
  OPENING HOURS
==================================================*/

const OPENING_HOURS = {

    1: {
        open: "08:00",
        close: "17:00"
    },

    2: {
        open: "08:00",
        close: "17:00"
    },

    3: {
        open: "08:00",
        close: "17:00"
    },

    4: {
        open: "08:00",
        close: "17:00"
    },

    5: {
        open: "08:00",
        close: "17:00"
    },

    6: {
        open: "08:00",
        close: "14:00"
    }

};


/*==================================================
  ELEMENTS
==================================================*/

const bookingForm =
    document.getElementById("bookingForm");

const bookingDate =
    document.getElementById("bookingDate");

const bookingTime =
    document.getElementById("bookingTime");

const timeSlots =
    document.getElementById("timeSlots");

const dateMessage =
    document.getElementById("dateMessage");

const bookingMessage =
    document.getElementById("bookingMessage");

const confirmBooking =
    document.getElementById("confirmBooking");

const summaryService =
    document.getElementById("summaryService");

const summaryDate =
    document.getElementById("summaryDate");

const summaryTime =
    document.getElementById("summaryTime");

const summaryPrice =
    document.getElementById("summaryPrice");

const successModal =
    document.getElementById("successModal");

const successDetails =
    document.getElementById("successDetails");

  


/*==================================================
  SET MINIMUM DATE
==================================================*/

function setMinimumDate(){

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(today.getDate())
        .padStart(2, "0");

    bookingDate.min =
        `${year}-${month}-${day}`;

}


setMinimumDate();


/*==================================================
  GET DAY OF WEEK
==================================================*/

function getDayNumber(dateString){

    const date =
        new Date(`${dateString}T12:00:00`);

    return date.getDay();

}


/*==================================================
  FORMAT DATE
==================================================*/

function formatDate(dateString){

    const date =
        new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString(
        "en-ZA",
        {
            weekday:"long",
            day:"numeric",
            month:"long",
            year:"numeric"
        }
    );

}


/*==================================================
  GENERATE TIME SLOTS
==================================================*/

function generateTimeSlots(open, close){

    const slots = [];

    let [hour, minute] =
        open.split(":").map(Number);

    const [closeHour, closeMinute] =
        close.split(":").map(Number);


    while(
        hour < closeHour ||
        (
            hour === closeHour &&
            minute < closeMinute
        )
    ){

        const time =
            `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`;

        slots.push(time);

        minute += 30;

        if(minute >= 60){

            hour += 1;

            minute -= 60;

        }

    }

    return slots;

}


/*==================================================
  FORMAT TIME
==================================================*/

function formatTime(time){

    const [hourString, minute] =
        time.split(":");

    let hour =
        Number(hourString);

    const suffix =
        hour >= 12 ? "PM" : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;

}


/*==================================================
  DATE CHANGE
==================================================*/

bookingDate.addEventListener(
    "change",
    async function(){

        const selectedDate =
            bookingDate.value;

        bookingTime.value = "";

        summaryDate.textContent =
            "Not selected";

        summaryTime.textContent =
            "Not selected";

        timeSlots.innerHTML = "";

        bookingMessage.textContent = "";

        bookingMessage.className =
            "booking-message";


        if(!selectedDate){

            return;

        }


        const day =
            getDayNumber(selectedDate);


        /* SUNDAY */

        if(day === 0){

            dateMessage.textContent =
                "Armando's Barber is closed on Sundays.";

            timeSlots.innerHTML = `
                <div class="empty-slots">

                    <i class="fa-solid fa-store-slash"></i>

                    <p>
                        We are closed on Sundays.
                        Please choose another date.
                    </p>

                </div>
            `;

            return;

        }


        /* CHECK OPENING HOURS */

        const hours =
            OPENING_HOURS[day];


        if(!hours){

            dateMessage.textContent =
                "This day is unavailable.";

            return;

        }


        dateMessage.textContent =
            `${formatDate(selectedDate)} • ${formatTime(hours.open)} – ${formatTime(hours.close)}`;


        summaryDate.textContent =
            formatDate(selectedDate);


        await loadAvailableTimes(
            selectedDate,
            hours.open,
            hours.close
        );

    }
);


/*==================================================
  LOAD AVAILABLE TIMES
==================================================*/

async function loadAvailableTimes(
    selectedDate,
    open,
    close
){

    timeSlots.innerHTML = `
        <div class="empty-slots">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                Checking available times...
            </p>

        </div>
    `;


    const { data, error } =
        await supabaseClient
            .from("bookings")
            .select("booking_time")
            .eq("booking_date", selectedDate)
            .eq("status", "confirmed");


    if(error){

        console.error(error);

        timeSlots.innerHTML = `
            <div class="empty-slots">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <p>
                    We couldn't load the available times.
                    Please try again.
                </p>

            </div>
        `;

        return;

    }


    const bookedTimes =
        new Set(
            data.map(
                booking =>
                    booking.booking_time.substring(0,5)
            )
        );


    const slots =
        generateTimeSlots(open, close);


    timeSlots.innerHTML = "";


    let availableCount = 0;


    slots.forEach(time => {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "time-slot";

        button.textContent =
            formatTime(time);


        if(bookedTimes.has(time)){

            button.classList.add("booked");

            button.disabled = true;

            button.title =
                "This time is already booked";

        }else{

            availableCount++;


            button.addEventListener(
                "click",
                function(){

                    selectTime(
                        time,
                        button
                    );

                }
            );

        }


        timeSlots.appendChild(button);

    });


    if(availableCount === 0){

        timeSlots.innerHTML = `
            <div class="empty-slots">

                <i class="fa-solid fa-calendar-xmark"></i>

                <p>
                    There are no available appointments
                    on this date.
                </p>

            </div>
        `;

    }

}


/*==================================================
  SELECT TIME
==================================================*/

function selectTime(
    time,
    selectedButton
){

    document
        .querySelectorAll(".time-slot")
        .forEach(button => {

            button.classList.remove("selected");

        });


    selectedButton.classList.add("selected");


    bookingTime.value =
        time;


    summaryTime.textContent =
        formatTime(time);


    bookingMessage.textContent = "";

    bookingMessage.className =
        "booking-message";

}


/*==================================================
  SERVICE CHANGE
==================================================*/

document
    .querySelectorAll(
        'input[name="service"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            function(){

                const service =
                    this.value;

                const price =
                    SERVICES[service];


                summaryService.textContent =
                    service;


                summaryPrice.textContent =
                    `R${price}`;


                bookingMessage.textContent = "";

                bookingMessage.className =
                    "booking-message";

            }
        );

    });


/*==================================================
  SHOW MESSAGE
==================================================*/

function showMessage(
    message,
    type = "error"
){

    bookingMessage.textContent =
        message;

    bookingMessage.className =
        `booking-message ${type}`;

}


/*==================================================
  VALIDATE PHONE
==================================================*/

function validPhone(phone){

    const cleaned =
        phone.replace(/\s+/g, "");

    return /^(\+27|0)[0-9]{9}$/.test(
        cleaned
    );

}


/*==================================================
  BOOKING SUBMISSION
==================================================*/

bookingForm.addEventListener(
    "submit",
    async function(event){

        event.preventDefault();


        /* SERVICE */

        const selectedService =
            document.querySelector(
                'input[name="service"]:checked'
            );


        if(!selectedService){

            showMessage(
                "Please select a service."
            );

            return;

        }


        /* DATE */

        const selectedDate =
            bookingDate.value;


        if(!selectedDate){

            showMessage(
                "Please select an appointment date."
            );

            return;

        }


        /* TIME */

        const selectedTime =
            bookingTime.value;


        if(!selectedTime){

            showMessage(
                "Please select an available time."
            );

            return;

        }


        /* CUSTOMER */

        const customerName =
            document
                .getElementById("customerName")
                .value
                .trim();


        const customerPhone =
            document
                .getElementById("customerPhone")
                .value
                .trim();


        const customerEmail =
            document
                .getElementById("customerEmail")
                .value
                .trim();


        if(!customerName){

            showMessage(
                "Please enter your full name."
            );

            return;

        }


        if(!validPhone(customerPhone)){

            showMessage(
                "Please enter a valid South African phone number."
            );

            return;

        }


        /* CHECK DAY */

        const day =
            getDayNumber(selectedDate);


        if(day === 0){

            showMessage(
                "Armando's Barber is closed on Sundays."
            );

            return;

        }


        /* PRICE */

        const price =
            SERVICES[selectedService.value];


        /* DISABLE BUTTON */

        confirmBooking.disabled = true;

        confirmBooking.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            SAVING APPOINTMENT...
        `;


        showMessage(
            "Checking the appointment...",
            "success"
        );


        /*==================================================
          FINAL DOUBLE-BOOKING CHECK
        ==================================================*/

        const {
            data: existingBooking,
            error: checkError
        } =
            await supabaseClient
                .from("bookings")
                .select("id")
                .eq(
                    "booking_date",
                    selectedDate
                )
                .eq(
                    "booking_time",
                    selectedTime
                )
                .eq(
                    "status",
                    "confirmed"
                )
                .maybeSingle();


        if(checkError){

            console.error(checkError);

            showMessage(
                "We couldn't verify that time. Please try again."
            );

            resetConfirmButton();

            return;

        }


        if(existingBooking){

            showMessage(
                "Sorry, that appointment was just booked by someone else. Please choose another time."
            );

            bookingTime.value = "";

            summaryTime.textContent =
                "Not selected";


            await loadAvailableTimes(
                selectedDate,
                OPENING_HOURS[day].open,
                OPENING_HOURS[day].close
            );


            resetConfirmButton();

            return;

        }


        /*==================================================
          SAVE BOOKING
        ==================================================*/

        const {
            data,
            error
        } =
            await supabaseClient
                .from("bookings")
                .insert({

                    customer_name:
                        customerName,

                    customer_phone:
                        customerPhone,

                    customer_email:
                        customerEmail || null,

                    service:
                        selectedService.value,

                    booking_date:
                        selectedDate,

                    booking_time:
                        selectedTime,

                    price:
                        price,

                    status:
                        "confirmed"

                })
                .select()
                .single();


        /*==================================================
          DATABASE DOUBLE-BOOKING PROTECTION
        ==================================================*/

        if(error){

            console.error(error);


            /*
              PostgreSQL unique constraint
              catches another booking made
              at the same moment.
            */

            if(
                error.code === "23505"
            ){

                showMessage(
                    "Sorry, that time was just booked. Please choose another available time."
                );


                bookingTime.value = "";

                summaryTime.textContent =
                    "Not selected";


                await loadAvailableTimes(
                    selectedDate,
                    OPENING_HOURS[day].open,
                    OPENING_HOURS[day].close
                );


                resetConfirmButton();

                return;

            }


            showMessage(
                "Something went wrong while saving your appointment. Please try again."
            );


            resetConfirmButton();

            return;

        }


        /*==================================================
          SUCCESS
        ==================================================*/

        console.log(
            "Booking created:",
            data
        );


        successDetails.textContent =
            `${selectedService.value} • ${formatDate(selectedDate)} • ${formatTime(selectedTime)} • R${price}`;

/*==================================================
  OPEN WHATSAPP AFTER SUCCESSFUL DATABASE BOOKING
==================================================*/

const whatsappNumber =
    "27694028390";


const whatsappMessage =
`🔔 NEW ARMANDO'S BARBER BOOKING

Customer: ${customerName}
Service: ${selectedService.value}
Date: ${formatDate(selectedDate)}
Time: ${formatTime(selectedTime)}
Phone: ${customerPhone}
Price: R${price}

Hi Armando's Barber, I have just booked an appointment.`;


const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;


/*
  Save the success information so it can
  be shown when the customer returns.
*/

sessionStorage.setItem(
    "armandoBookingSuccess",
    "true"
);

sessionStorage.setItem(
    "armandoBookingDetails",
    `${selectedService.value} • ${formatDate(selectedDate)} • ${formatTime(selectedTime)} • R${price}`
);


/*
  Open WhatsApp.
*/

window.location.href =
    whatsappURL;



  /*==================================================
  SHOW SUCCESS AFTER RETURNING FROM WHATSAPP
==================================================*/

window.addEventListener(
    "pageshow",
    function(){

        const bookingSuccess =
            sessionStorage.getItem(
                "armandoBookingSuccess"
            );


        if(
            bookingSuccess === "true"
        ){

            const details =
                sessionStorage.getItem(
                    "armandoBookingDetails"
                );


            successDetails.textContent =
                details ||
                "Your appointment has been successfully booked.";


            successModal.classList.add(
                "show"
            );


            sessionStorage.removeItem(
                "armandoBookingSuccess"
            );

            sessionStorage.removeItem(
                "armandoBookingDetails"
            );

        }

    }
);


/*==================================================
  RESET BUTTON
==================================================*/

function resetConfirmButton(){

    confirmBooking.disabled =
        false;

    confirmBooking.innerHTML = `
        CONFIRM APPOINTMENT
        <i class="fa-solid fa-arrow-right"></i>
    `;

}


/*==================================================
  PREVENT PAST DATE MANUALLY
==================================================*/

bookingDate.addEventListener(
    "input",
    function(){

        if(
            this.value &&
            this.value < this.min
        ){

            this.value = "";

            dateMessage.textContent =
                "Please choose today or a future date.";

            timeSlots.innerHTML = `
                <div class="empty-slots">

                    <i class="fa-solid fa-calendar-xmark"></i>

                    <p>
                        Please choose a valid future date.
                    </p>

                </div>
            `;

        }

    }
);
