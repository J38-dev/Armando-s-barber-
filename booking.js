/*==================================================
  ARMANDO'S BARBER
  GOOGLE SHEETS BOOKING SYSTEM
==================================================*/


/*==================================================
  GOOGLE APPS SCRIPT CONNECTION
==================================================*/

const API_URL =
    "https://script.google.com/macros/s/AKfycbxgzoF8GAGcN9uT4fju5eSVCokmpghyQw0cmvMnntmZX889vJaWNfhR5rIuabl7MDUF/exec";


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
    1: { open: "08:00", close: "17:00" },
    2: { open: "08:00", close: "17:00" },
    3: { open: "08:00", close: "17:00" },
    4: { open: "08:00", close: "17:00" },
    5: { open: "08:00", close: "17:00" },
    6: { open: "08:00", close: "14:00" }
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

function setMinimumDate() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    bookingDate.min =
        `${year}-${month}-${day}`;
}

setMinimumDate();


/*==================================================
  DATE HELPERS
==================================================*/

function getDayNumber(dateString) {
    return new Date(
        `${dateString}T12:00:00`
    ).getDay();
}


function formatDate(dateString) {
    return new Date(
        `${dateString}T12:00:00`
    ).toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


function formatTime(time) {
    const [hourString, minute] =
        time.split(":");

    let hour = Number(hourString);

    const suffix =
        hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}


/*==================================================
  GENERATE TIME SLOTS
==================================================*/

function generateTimeSlots(open, close) {
    const slots = [];

    let [hour, minute] =
        open.split(":").map(Number);

    const [closeHour, closeMinute] =
        close.split(":").map(Number);

    while (
        hour < closeHour ||
        (
            hour === closeHour &&
            minute < closeMinute
        )
    ) {
        const time =
            `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

        slots.push(time);

        minute += 30;

        if (minute >= 60) {
            hour++;
            minute -= 60;
        }
    }

    return slots;
}


/*==================================================
  GOOGLE SHEETS API REQUEST
==================================================*/

async function apiGet(action, parameters = {}) {
    const url = new URL(API_URL);

    url.searchParams.set("action", action);

    Object.entries(parameters).forEach(
        ([key, value]) => {
            url.searchParams.set(key, value);
        }
    );

    const response = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(
            "The booking server could not be reached."
        );
    }

    return response.json();
}


/*==================================================
  CHECK AVAILABILITY FROM GOOGLE SHEETS
==================================================*/

async function loadAvailableTimes(
    selectedDate,
    open,
    close
) {
    timeSlots.innerHTML = `
        <div class="empty-slots">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Checking available times...</p>
        </div>
    `;

    try {
        const result = await apiGet(
            "availability",
            { date: selectedDate }
        );

        if (!result.success) {
            throw new Error(
                result.error ||
                "Unable to check availability."
            );
        }

        if (result.closed) {
            dateMessage.textContent =
                "Armando's Barber is closed on this date.";

            timeSlots.innerHTML = `
                <div class="empty-slots">
                    <i class="fa-solid fa-store-slash"></i>
                    <p>We are closed on this date.</p>
                </div>
            `;

            return;
        }

        const bookedTimes = new Set(
            result.bookedTimes || []
        );

        const slots =
            generateTimeSlots(open, close);

        timeSlots.innerHTML = "";

        let availableCount = 0;

        slots.forEach(time => {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "time-slot";
            button.textContent = formatTime(time);

            if (bookedTimes.has(time)) {
                button.classList.add("booked");
                button.disabled = true;

                button.title =
                    "This time is already booked";
            } else {
                availableCount++;

                button.addEventListener(
                    "click",
                    function() {
                        selectTime(time, button);
                    }
                );
            }

            timeSlots.appendChild(button);
        });

        if (availableCount === 0) {
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

    } catch (error) {
        console.error(
            "Availability error:",
            error
        );

        timeSlots.innerHTML = `
            <div class="empty-slots">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>
                    We couldn't check availability.
                    Please refresh the page and try again.
                </p>
            </div>
        `;
    }
}


/*==================================================
  DATE CHANGE
==================================================*/

bookingDate.addEventListener(
    "change",
    async function() {
        const selectedDate = bookingDate.value;

        bookingTime.value = "";

        summaryDate.textContent = "Not selected";
        summaryTime.textContent = "Not selected";

        timeSlots.innerHTML = "";

        bookingMessage.textContent = "";
        bookingMessage.className = "booking-message";

        if (!selectedDate) {
            dateMessage.textContent = "";
            return;
        }

        if (selectedDate < bookingDate.min) {
            dateMessage.textContent =
                "Please choose today or a future date.";

            return;
        }

        const day = getDayNumber(selectedDate);

        if (day === 0) {
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

        const hours = OPENING_HOURS[day];

        if (!hours) {
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
  SELECT TIME
==================================================*/

function selectTime(time, selectedButton) {
    document
        .querySelectorAll(".time-slot")
        .forEach(button => {
            button.classList.remove("selected");
        });

    selectedButton.classList.add("selected");

    bookingTime.value = time;

    summaryTime.textContent =
        formatTime(time);

    bookingMessage.textContent = "";
    bookingMessage.className = "booking-message";
}


/*==================================================
  SERVICE CHANGE
==================================================*/

document
    .querySelectorAll('input[name="service"]')
    .forEach(input => {
        input.addEventListener(
            "change",
            function() {
                const service = this.value;

                summaryService.textContent = service;

                summaryPrice.textContent =
                    `R${SERVICES[service]}`;

                bookingMessage.textContent = "";
                bookingMessage.className = "booking-message";
            }
        );
    });


/*==================================================
  SHOW MESSAGE
==================================================*/

function showMessage(
    message,
    type = "error"
) {
    bookingMessage.textContent = message;

    bookingMessage.className =
        `booking-message ${type}`;
}


/*==================================================
  VALIDATE PHONE
==================================================*/

function validPhone(phone) {
    const cleaned =
        phone.replace(/\s+/g, "");

    return /^(\+27|0)[0-9]{9}$/.test(cleaned);
}


/*==================================================
  RESET SUBMIT BUTTON
==================================================*/

function resetConfirmButton() {
    confirmBooking.disabled = false;

    confirmBooking.innerHTML = `
        CONFIRM APPOINTMENT
        <i class="fa-solid fa-arrow-right"></i>
    `;
}


/*==================================================
  SAVE BOOKING TO GOOGLE SHEETS
==================================================*/

async function saveBooking(booking) {
    const response = await fetch(API_URL, {
        method: "POST",
        redirect: "follow",

        /*
         * text/plain avoids the browser's JSON
         * content-type preflight request.
         *
         * The Apps Script reads the request body
         * and parses its JSON contents.
         */

        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
            action: "book",
            customerName: booking.customerName,
            phone: booking.phone,
            service: booking.service,
            date: booking.date,
            time: booking.time
        })
    });

    if (!response.ok) {
        throw new Error(
            "The booking server returned an error."
        );
    }

    return response.json();
}


/*==================================================
  BOOKING SUBMISSION
==================================================*/

bookingForm.addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        if (confirmBooking.disabled) {
            return;
        }

        const selectedService =
            document.querySelector(
                'input[name="service"]:checked'
            );

        if (!selectedService) {
            showMessage(
                "Please select a service."
            );

            return;
        }

        const selectedDate = bookingDate.value;

        if (!selectedDate) {
            showMessage(
                "Please select an appointment date."
            );

            return;
        }

        if (selectedDate < bookingDate.min) {
            showMessage(
                "Please choose today or a future date."
            );

            return;
        }

        const selectedTime = bookingTime.value;

        if (!selectedTime) {
            showMessage(
                "Please select an available time."
            );

            return;
        }

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

        if (!customerName || customerName.length > 100) {
            showMessage(
                "Please enter a valid full name."
            );

            return;
        }

        if (!validPhone(customerPhone)) {
            showMessage(
                "Please enter a valid South African phone number."
            );

            return;
        }

        const day = getDayNumber(selectedDate);

        if (day === 0 || !OPENING_HOURS[day]) {
            showMessage(
                "Armando's Barber is closed on this date."
            );

            return;
        }

        const hours = OPENING_HOURS[day];

        if (
            selectedTime < hours.open ||
            selectedTime >= hours.close
        ) {
            showMessage(
                "Please select a time within opening hours."
            );

            return;
        }

        if (
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(selectedTime) ||
            Number(selectedTime.slice(3, 5)) % 30 !== 0
        ) {
            showMessage(
                "Please select a valid appointment time."
            );

            return;
        }

        const price = SERVICES[selectedService.value];

        confirmBooking.disabled = true;

        confirmBooking.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            SAVING APPOINTMENT...
        `;

        showMessage(
            "Saving your appointment...",
            "success"
        );

        try {
            /*
             * The server checks availability again
             * while holding a lock before saving.
             */

            const result = await saveBooking({
                customerName: customerName,
                phone: customerPhone,
                service: selectedService.value,
                date: selectedDate,
                time: selectedTime
            });

            if (!result.success) {
                if (result.code === "SLOT_TAKEN") {
                    bookingTime.value = "";

                    summaryTime.textContent =
                        "Not selected";

                    showMessage(
                        "Sorry, this time has just been booked. Please select another time."
                    );

                    await loadAvailableTimes(
                        selectedDate,
                        hours.open,
                        hours.close
                    );

                    return;
                }

                showMessage(
                    result.error ||
                    "Your booking could not be saved. Please try again."
                );

                return;
            }

            /*
             * Only continue after the API confirms
             * that the booking was saved.
             */

            const bookingDetails =
                `${selectedService.value} • ${formatDate(selectedDate)} • ${formatTime(selectedTime)} • R${price}`;

            const whatsappNumber = "27694028390";

            const whatsappMessage =
`🔔 NEW ARMANDO'S BARBER BOOKING

Booking ID: ${result.bookingId}
Customer: ${customerName}
Service: ${selectedService.value}
Date: ${formatDate(selectedDate)}
Time: ${formatTime(selectedTime)}
Phone: ${customerPhone}
Price: R${price}

Hi Armando's Barber, I have just booked an appointment.`;

            const whatsappURL =
                `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

            sessionStorage.setItem(
                "armandoBookingSuccess",
                "true"
            );

            sessionStorage.setItem(
                "armandoBookingDetails",
                bookingDetails
            );

            window.location.href = whatsappURL;

        } catch (error) {
            console.error(
                "Booking submission error:",
                error
            );

            showMessage(
                "We couldn't confirm the booking response. Please check the booking sheet before trying again, to avoid creating a duplicate appointment."
            );

        } finally {
            resetConfirmButton();
        }
    }
);


/*==================================================
  SHOW SUCCESS AFTER RETURNING FROM WHATSAPP
==================================================*/

function showBookingSuccess() {
    const bookingSuccess =
        sessionStorage.getItem(
            "armandoBookingSuccess"
        );

    if (bookingSuccess !== "true") {
        return;
    }

    const details =
        sessionStorage.getItem(
            "armandoBookingDetails"
        );

    successDetails.textContent =
        details ||
        "Your appointment has been successfully booked.";

    successModal.classList.add("show");

    sessionStorage.removeItem(
        "armandoBookingSuccess"
    );

    sessionStorage.removeItem(
        "armandoBookingDetails"
    );
}


/*==================================================
  DETECT RETURN FROM WHATSAPP
==================================================*/

window.addEventListener(
    "pageshow",
    showBookingSuccess
);

document.addEventListener(
    "visibilitychange",
    function() {
        if (!document.hidden) {
            showBookingSuccess();
        }
    }
);


/*==================================================
  PREVENT PAST DATES
==================================================*/

bookingDate.addEventListener(
    "input",
    function() {
        if (
            this.value &&
            this.value < this.min
        ) {
            this.value = "";

            bookingTime.value = "";

            summaryDate.textContent = "Not selected";
            summaryTime.textContent = "Not selected";

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
