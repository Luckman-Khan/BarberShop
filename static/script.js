// Set today's date as default
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.min = today;

    loadBarbers();
});

async function loadBarbers() {
    try {
        const response = await fetch('/barbers');
        const barbers = await response.json();

        const select = document.getElementById('barber');
        select.innerHTML = '';

        barbers.forEach((barber, index) => {
            const option = document.createElement('option');
            option.value = barber.id;
            option.text = barber.name;
            select.appendChild(option);

            // Auto select first barber
            if (index === 0) {
                loadSlots();
            }
        });

        if (barbers.length > 0) {
            loadSlots();
        }
    } catch (error) {
        console.error('Error loading barbers:', error);
    }
}

async function loadSlots() {
    const barberId = document.getElementById('barber').value;
    const date = document.getElementById('date').value;

    if (!barberId || !date) return;

    const container = document.getElementById('slots-container');
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Loading slots...</p>';

    try {
        const response = await fetch(`/slots?barber_id=${barberId}&date=${date}`);
        const slots = await response.json();

        container.innerHTML = '';

        if (slots.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No slots available.</p>';
            return;
        }

        slots.forEach(slot => {
            const btn = document.createElement('div');
            btn.className = 'slot-btn';
            btn.innerText = slot;
            btn.onclick = () => bookAppointment(slot);
            btn.style.textAlign = 'center';
            container.appendChild(btn);
        });
    } catch (error) {
        console.error('Error loading slots:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Error loading slots.</p>';
    }
}

async function bookAppointment(time) {
    const name = prompt("Please enter your name to book this slot:");
    if (!name) return;

    const barberId = document.getElementById('barber').value;
    const date = document.getElementById('date').value;

    try {
        const response = await fetch('/book?barber_id=' + barberId + '&date=' + date + '&time=' + time + '&name=' + encodeURIComponent(name), {
            method: 'POST'
        });

        if (response.ok) {
            alert('Booking Successful!');
            loadSlots(); // Refresh slots
        } else {
            const error = await response.json();
            alert('Booking Failed: ' + error.detail);
        }
    } catch (error) {
        console.error('Error booking:', error);
        alert('An error occurred.');
    }
}
