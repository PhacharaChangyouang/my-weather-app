const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherCard = document.querySelector('#weather-card');
const cityNameEl = document.querySelector('#city-name');
const weatherIconEl = document.querySelector('#weather-icon');
const temperatureEl = document.querySelector('#temperature');
const descriptionEl = document.querySelector('#description');
const humidityEl = document.querySelector('#humidity');
const windSpeedEl = document.querySelector('#wind-speed');
const errorMessageEl = document.querySelector('#error-message');
const loadingSpinnerEl = document.querySelector('#loading-spinner');
const forecastContainer = document.querySelector('#forecast-container');
const forecastListEl = document.querySelector('#forecast-list');


const apiKey = 'afcef863174978e42a25df5c4261c13c';

// สำหรับอัปเดต UI ตามข้อมูลสภาพอากาศ
function updateUI(weatherData) {
    const { name, main, weather, wind } = weatherData;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];
    const { speed } = wind;

    // บันทึกชื่อเมืองล่าสุด
    localStorage.setItem('lastSearchedCity', name);

    const body = document.body;
    let iconClass = '';
    let bgClass = '';
    const isDay = icon.slice(-1) === 'd';
    let iconAnimationClass = '';

    switch (icon.substring(0, 2)) {
        case '01': // ท้องฟ้าแจ่มใส
            iconClass = isDay ? 'fas fa-sun' : 'fas fa-moon';
            bgClass = 'bg-clear';
            break;
        case '02': // เมฆประปราย
        case '03': // เมฆเป็นก้อน
        case '04': // เมฆครึ้ม
            iconClass = isDay ? 'fas fa-cloud-sun' : 'fas fa-cloud-moon';
            bgClass = 'bg-clouds';
            iconAnimationClass = 'cloud-icon-animated';
            break;
        case '09': // ฝนตกปรอยๆ
        case '10': // ฝน
            iconClass = 'fas fa-cloud-showers-heavy';
            bgClass = 'bg-rain';
            break;
        case '11': // พายุฝนฟ้าคะนอง
            iconClass = 'fas fa-bolt';
            bgClass = 'bg-thunderstorm';
            break;
        case '13': // หิมะ
            iconClass = 'fas fa-snowflake';
            bgClass = 'bg-snow';
            break;
        case '50': // หมอก
            iconClass = 'fas fa-smog';
            bgClass = 'bg-mist';
            break;
        default:
            iconClass = 'fas fa-question-circle';
            bgClass = 'bg-day';
    }
    
    body.className = `${isDay ? bgClass : 'bg-night'} transition-all duration-1000`;

    cityNameEl.textContent = name;
    weatherIconEl.innerHTML = `<i class="${iconClass} animate-fade-in ${iconAnimationClass}"></i>`;
    temperatureEl.textContent = `${Math.round(temp)}°C`;
    descriptionEl.textContent = description;
    humidityEl.textContent = `${humidity}%`;
    windSpeedEl.textContent = `${(speed * 3.6).toFixed(1)} km/h`;
    weatherCard.classList.remove('opacity-50');
}

function updateForecastUI(forecastData) {
    forecastListEl.innerHTML = ''; 
    forecastContainer.classList.remove('hidden');

    const dailyForecasts = forecastData.list.filter(item => {
        return item.dt_txt.includes('12:00:00');
    });

    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date);
        const temp = Math.round(forecast.main.temp);
        const iconCode = forecast.weather[0].icon;
        
        const forecastItemHtml = `
            <div class="forecast-item">
                <p>${day}</p>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather icon" class="w-12 h-12 mx-auto">
                </div>
                <p class="forecast-temp">${temp}°C</p>
            </div>
        `;
        forecastListEl.innerHTML += forecastItemHtml;
    });
}

// เรียก API พยากรณ์อากาศล่วงหน้าน
async function getForecastData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('ไม่พบข้อมูลพยากรณ์อากาศ');
        }
        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        console.error(error);
        forecastContainer.classList.add('hidden');
    }
}

async function getWeatherData(city) {
    loadingSpinnerEl.classList.remove('hidden');
    errorMessageEl.classList.add('hidden');
    weatherCard.classList.add('opacity-50');
    forecastContainer.classList.add('hidden');

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('ไม่พบข้อมูลสภาพอากาศสำหรับเมืองนี้');
        }
        const data = await response.json();
        updateUI(data);
        getForecastData(city);
    } catch (error) {
        errorMessageEl.textContent = error.message;
        errorMessageEl.classList.remove('hidden');
        weatherCard.classList.remove('opacity-50');
    } finally {
        loadingSpinnerEl.classList.add('hidden');
    }
}


searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const cityName = cityInput.value.trim();
    if (cityName) {
        getWeatherData(cityName);
    } else {
        errorMessageEl.textContent = 'กรุณาป้อนชื่อเมือง';
        errorMessageEl.classList.remove('hidden');
    }
});


window.addEventListener('load', () => {
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        cityInput.value = lastCity; 
        getWeatherData(lastCity);
    } else {
        getWeatherData('Bangkok');//ถ้าไม่มีโลคอลสเตดให้แบ้งคอกเป็นค่าเริ่มต้น
    }
});
