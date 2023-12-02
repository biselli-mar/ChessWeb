/* eslint-disable no-undef */
"use strict";

function getCookie(name) {
    console.log(document.cookie);
    const value = `; ${document.cookie}`;
    console.log(value);
    const parts = value.split(`; ${name}=`);
    console.log(parts);
    if (parts.length === 2) return parts.pop().split(';').shift();
}