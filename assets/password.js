class PasswordModal {
  constructor(dialogSelector = '#password-modal') {
    this.dialog = document.querySelector(dialogSelector);
    this.trigger = document.querySelector('[data-password-trigger]');

    if (!this.dialog || !this.trigger) return;

    this.supportsDialog = typeof this.dialog.showModal === 'function';
    this.init();
  }

  init() {
    if (this.supportsDialog) {
      this.trigger.addEventListener('click', () => this.open());

      this.dialog
        .querySelectorAll('[data-password-close]')
        .forEach((btn) => btn.addEventListener('click', () => this.close()));

      this.dialog.addEventListener('click', (event) => {
        const { left, right, top, bottom } = this.dialog.getBoundingClientRect();
        const clickedInside =
          event.clientX >= left &&
          event.clientX <= right &&
          event.clientY >= top &&
          event.clientY <= bottom;

        if (!clickedInside) this.close();
      });
    } else {
      this.trigger.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/password';
      });
    }
  }

  open() {
    this.dialog.showModal();
    this.dialog.querySelector('#password-field')?.focus();
  }

  close() {
    this.dialog.close();
  }
}

class BackgroundVideoController {
  constructor(selector = '.password-bg-video') {
    this.video = document.querySelector(selector);
    if (!this.video) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.applyMotionPreference();
    this.reducedMotion.addEventListener('change', () => this.applyMotionPreference());
  }

  applyMotionPreference() {
    if (this.reducedMotion.matches) {
      this.video.pause();
      this.video.removeAttribute('autoplay');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PasswordModal();
  new BackgroundVideoController();
});