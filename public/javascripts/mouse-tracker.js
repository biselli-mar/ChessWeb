let root = document.querySelector(":root");
let body = document.body;

body.addEventListener('mousemove', (e) => {
    root.style.setProperty('--mouse-x', e.clientX + "px");
    root.style.setProperty('--mouse-y', e.clientY + "px");
});
