// ==================== BASE URL ====================
const API_BASE = "https://event-attendance-prediction-1-0z9g.onrender.com/"; 

// ==================== EVENT FORM LOGIC ====================
document.addEventListener("DOMContentLoaded", (e) => {
  e.preventDefault();

  // Check if current page is event form
  if (window.location.pathname.includes("eventform.html")) {
    let submitBtn = document.querySelector(".submit");
    let climatebtn = document.querySelector(".climatebtn");

    // All input field references
    let fieldele = [
      document.querySelector(".Atmosphere"),
      document.querySelector(".eventType"),
      document.querySelector(".climate"),
      document.querySelector(".location"),
      document.querySelector(".date"),
      document.querySelector(".ticketPrice"),
      document.querySelector(".time"),
      document.querySelector(".capacity"),
      document.querySelector(".marketing"),
      document.querySelector(".extraActivities"),
    ];

    // Reset border color when typing
    fieldele.forEach((input) => {
      input.addEventListener("input", () => {
        input.style.border = "1px solid #eee1e1ff";
      });
    });

    let weather1;
    let selectedDate;

    // ============ FETCH WEATHER ============
    climatebtn.addEventListener("click", (event) => {
      event.preventDefault();

      let cityName = document.querySelector(".location").value.trim();
      selectedDate = document.querySelector(".date").value.trim();

      if (!cityName || !selectedDate) {
        alert("Please enter both location and date first!");
        return;
      }

      // Call weather API
      fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=cf1382b4659241fcbe5143631252610&q=${cityName}&days=10`
      )
        .then((res) => {
          if (!res.ok) throw new Error("City not found");
          return res.json();
        })
        .then((d) => {
          let weatherDay = d.forecast.forecastday.find(
            (day) => day.date === selectedDate
          );

          if (!weatherDay) {
            alert("Date must be within the next 10 days!");
            return;
          }

          weather1 = weatherDay.day.daily_chance_of_rain;
          document.querySelector(".climate").value = `${weather1}% chance of rain`;
        })
        .catch((err) => alert(err.message));
    });

    // ============ HANDLE FORM SUBMIT ============
    submitBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      let allvalid = true;

      // Validate required fields
      fieldele.forEach((input) => {
        if (input.value === "") {
          input.style.border = "1px solid #df1111ff";
          allvalid = false;
        }
      });

      if (!allvalid) {
        alert("Please fill all required fields before submitting!");
        return;
      }

      // Extract only the year
      let date = new Date(selectedDate).getFullYear();
      let selectedDay = document.querySelector(".day:checked");

      // Prepare data for backend
      let data = {
        Atmosphere: document.querySelector(".Atmosphere").value,
        event_type: document.querySelector(".eventType").value,
        location: document.querySelector(".location").value,
        chance_of_rain: weather1,
        date: date,
        time: document.querySelector(".time").value,
        capacity: document.querySelector(".capacity").value,
        marketing_percentage: document.querySelector(".marketing").value,
        day: selectedDay.value,
        extra_activity: document.querySelector(".extraActivities").value,
        ticket_price: document.querySelector(".ticketPrice").value,
      };

      console.log("📤 Sending to backend:", data);

      try {
        // Send data to backend
        const response = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log("📥 Backend response:", result);

        if (result.prediction) {
          // Store data locally and redirect to dashboard
          localStorage.setItem(
            "predictionData",
            JSON.stringify({
              prediction: result.prediction,
              formData: data,
            })
          );

          window.location.href = "./dashboard.html";
        } else {
          alert("Error: " + result.error);
        }
      } catch (error) {
        alert("Unable to connect to backend");
        console.error(error);
      }
    });
  }
});

// ==================== DASHBOARD PAGE ====================
if (window.location.pathname.includes("dashboard.html")) {
  let storedData = JSON.parse(localStorage.getItem("predictionData"));

  if (!storedData) {
    alert("No prediction data found. Please submit the form first.");
    window.location.href = "./eventform.html";
  } else {
    showDashboard(storedData.prediction, storedData.formData);
  }
}

// ==================== DASHBOARD FUNCTION ====================
function showDashboard(predictedAttendance, formData) {
  let marketingEffect = parseFloat(formData.marketing_percentage);
  let totalCapacity = parseInt(formData.capacity);
  let nonAttendees = Math.max(totalCapacity - predictedAttendance, 0);

  let predictedData = {
    predictedattendance: predictedAttendance,
    marketingeffect: marketingEffect,
    eventdistribution: {
      attendee: predictedAttendance,
      non_attendee: nonAttendees,
    },
  };

  // Display predicted attendance
  let attendeeCountele = document.getElementById("attendeeCount");
  if (attendeeCountele) {
    attendeeCountele.textContent = predictedData.predictedattendance;
  }

  // ===== BAR CHART =====
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["Predicted Attendance", "Marketing Effect (%)", "Capacity"],
      datasets: [
        {
          label: "Event Metrics",
          data: [
            predictedData.predictedattendance,
            predictedData.marketingeffect,
            totalCapacity,
          ],
          backgroundColor: ["#0d6efd", "#198754", "#ffc107"],
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: {
        legend: { display: false },
        title: { display: true, font: { size: 16 } },
      },
    },
  });

  // ===== PIE CHART =====
  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: ["Attendees", "Non-Attendees"],
      datasets: [
        {
          data: [
            predictedData.eventdistribution.attendee,
            predictedData.eventdistribution.non_attendee,
          ],
          backgroundColor: ["#0dcaf0", "#dc3545"],
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 13 } },
        },
        title: { display: true, font: { size: 16 } },
      },
    },
  });
}

// ==================== REDIRECT BUTTON ====================
let btnagain = document.querySelector(".predict-btn");
console.log(btnagain);

btnagain.addEventListener("click", () => {
  window.location.href = "./eventform.html";
});
