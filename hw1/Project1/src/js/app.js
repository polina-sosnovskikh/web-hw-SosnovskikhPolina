import { renderSymptomsAccordion, renderTodaySymptoms } from './symptoms.js';
import { initRating } from './rating.js';
import { initMedications } from './medications.js';
import { initCalendar } from './calendar.js';
import { initForecast } from './forecast.js';
import { initMap } from './map.js';
import { initCommunity } from './community.js';
import { initSettings } from './settings.js'; 
import { initReport } from './report.js'; 
import { initLanding } from './landing.js';
import { initSearch } from './search.js';

document.addEventListener('DOMContentLoaded', () => {

     if (document.querySelector('.landing-body')) {
        initLanding();
        return; 
    }

    // Главная страница
    if (document.getElementById('symptoms-accordion')) {
        renderSymptomsAccordion();
        renderTodaySymptoms();
        initRating();
        initMedications();
        initCalendar();
        initReport();
        initSearch();
    }

    // Страница прогноза
    if (document.querySelector('.forecast-intro')) {
        initForecast();
    }

    // Страница карты
    if (document.querySelector('.map-area')) {
        initMap();
    }

    // Страница сообщества
    if (document.querySelector('.feed__list')) {
        initCommunity();
    }

    // Страница настроек 
    if (document.querySelector('.profile')) {
        initSettings();
    }
});