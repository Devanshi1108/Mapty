'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  id = (Date.now() + '').slice(-10); //id is the current date converted to string and last 10 digit
  date = new Date();
  clicks = 0;
  constructor(distance, duration, coords) {
    this.distance = distance; //in km
    this.duration = duration; //in min
    this.coords = coords; //[latitude,longitude]
  }

  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance; //min/km
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevation) {
    super(distance, duration, coords);
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60); //km/hr
  }
}

class App {
  #map;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();

    //Get data from local storage
    this.getLocalStorageData();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevation);
    //Add event listners to the constructor so that they are executed
    containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
  }
  _getPosition() {
    //--GEO LOCATION API--
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your current location');
      }
    );
  }
  _loadMap(obj) {
    const { latitude } = obj.coords;
    const { longitude } = obj.coords;

    const coords = [latitude, longitude];
    //Adding leaflet
    //L.map(#id) of the map division in html
    //(coordinate array, zoom level)
    this.#map = L.map('map').setView(coords, 19);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //adding eventListner to the MAP using .on function
    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => this.renderWorkoutMarker(work));
  }

  _showForm(e) {
    this.#mapEvent = e;
    //show the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  hideForm() {
    //clear input feilds
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => ((form.style.display = 'grid'), 1000));
  }

  _toggleElevation() {
    //chnage from running to cycling
    //e.preventDefault();
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every(ip => Number.isFinite(ip)); //check if number is positive and fintie
    const allPositive = (...inputs) => inputs.every(ip => ip > 0); //check is all numbers are positive
    e.preventDefault();
    //Get data from form
    const ipType = inputType.value;
    const ipDistance = Number(inputDistance.value);
    const ipDuration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //Check if data is valid
    if (ipType == 'running') {
      const ipCadence = Number(inputCadence.value); //needs to be positive
      if (
        !validInputs(ipDistance, ipDuration, ipCadence) ||
        !allPositive(ipDistance, ipDuration, ipCadence)
      ) {
        //if ip is not a finite number
        return alert('Inputs have to be positive numbers');
      }
      //If running, create a running obj
      workout = new Running(ipDistance, ipDuration, [lat, lng], ipCadence);
    }
    if (ipType == 'cycling') {
      const ipElevation = Number(inputElevation.value); //can be negative
      if (!validInputs(ipDistance, ipDuration, ipElevation)) {
        //if ip is not a finite number
        return alert('Inputs have to be positive numbers');
      }
      //If cycling, create a cycling obj
      workout = new Cycling(ipDistance, ipDuration, [lat, lng], ipElevation);
    }

    //Add new object to the workout array
    this.#workout.push(workout);

    //Render workout on the map
    this.renderWorkoutMarker(workout);

    //Render workout on the list
    this.renderWorkoutList(workout);
    //Hide the form +clear input feilds
    this.hideForm();

    //set local storage to all workouts
    this.setLocalStorage();
  }

  renderWorkoutMarker(obj) {
    //add marker to clicked position
    //adding properties to popup (refer to documnetation og marker)
    L.marker(obj.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${obj.type}-popup`,
        })
      )
      .setPopupContent(
        `${obj.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${obj.description}`
      )
      .openPopup();
  }

  renderWorkoutList(obj) {
    let html = `<li class="workout workout--${obj.type}" data-id=${obj.id}>
          <h2 class="workout__title">${obj.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              obj.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${obj.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${obj.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (obj.type == 'running') {
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${obj.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${obj.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>  </li>`;
    }
    if (obj.type == 'cycling') {
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${obj.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${obj.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  moveToPopup(e) {
    if (!this.#map) return;
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    //move the map to the given location
    this.#map.setView(workout.coords, 19, {
      animate: true,
      pan: { duration: 1 },
    });

    //using the public interface
    //workout.click();
  }

  setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  getLocalStorageData() {
    const data = localStorage.getItem('workouts');
    if (!data) return;
    this.#workout = JSON.parse(data);
    this.#workout.forEach(work => this.renderWorkoutList(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
