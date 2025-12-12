document.addEventListener('DOMContentLoaded', () => {
  const timers = document.querySelectorAll('.countdown-urgency');

  timers.forEach(container => {
    const timer = container.querySelector('.countdown-timer');
    const endDateStr = container.dataset.endDate.replace(' ', 'T');
    const autoRestart = container.dataset.autoRestart === 'true';
    const restartHours = parseInt(container.dataset.restartHours || '24');
    const hideExpired = container.dataset.hideExpired === 'true';
    let endDate = new Date(endDateStr).getTime();

    if (isNaN(endDate)) {
      timer.innerHTML = "<p style='font-size:14px'>Invalid date format</p>";
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      let distance = endDate - now;

      if (distance <= 0) {
        if (autoRestart) {
          endDate = new Date(now + restartHours * 3600 * 1000).getTime();
          distance = endDate - now;
        } else {
          clearInterval(interval);
          if (hideExpired) {
            container.style.display = "none";
          } else {
            timer.innerHTML = "<p style='font-size:16px;font-weight:600;'>Offer ended</p>";
          }
          return;
        }
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const map = { days, hours, minutes, seconds };

      for (const [key, value] of Object.entries(map)) {
        const el = timer.querySelector('.' + key);
        const current = el.textContent;
        const newVal = value.toString().padStart(2, '0');
        if (current !== newVal) {
          el.textContent = newVal;
          el.classList.add('flip');
          setTimeout(() => el.classList.remove('flip'), 400);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
  });
});