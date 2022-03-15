// Variables
const svgContainer = document.querySelector("svg");
const modalContainer = document.querySelector(".modals");
const collectedItemsAmount = document.querySelector(
  ".badges__collected-amount"
);
const allItemsAmount = document.querySelector(".badges__all-amount");
const badgesContainer = document.querySelector(".badges");
const badgesRow = document.querySelector(".badges__row");
const removeAllBadgesBtn = document.querySelector(".badges__button--clear");
const onboardingBtn = document.querySelector(".onboarding__button");
const toggleBadgesBtn = document.querySelector(".badges__button--toggle");
const badgesContent = document.querySelector(".badges__content");
const finishScreen = document.querySelector(".finish");
const finishBtn = document.querySelector(".finish__button");

let collectedBadges = [];
let itemsAmount = 0;
let badgeButtonsDOM = [];

//Getting the items
class Items {
  async getItems() {
    try {
      let result = await fetch("tech-items.json");
      let data = await result.json();
      return data.items;
    } catch (error) {
      console.log(error);
    }
  }
}

class UI {
  displayItems(items) {
    let modals = "";
    items.forEach((item) => {
      let element = document.createElementNS("http://www.w3.org/2000/svg", "g");
      element.innerHTML = `${item.svg}`;
      element.setAttribute("data-bs-toggle", "modal");
      element.setAttribute("data-bs-target", `#modal${item.id}`);
      element.classList.add("svg__item");
      svgContainer.appendChild(element);
      modals += this.createModal(item);
    });
    modalContainer.innerHTML = modals;
  }

  createModal(item) {
    let modal = `<div class="modal fade" id="modal${
      item.id
    }" tabindex="-1" aria-labelledby="modalName" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
          <h2 class="modal-body__title" id="modalName">${item.name}</h2>
            <p class="modal-body__text">${item.description} <a href="${
      item.description_link
    }" class="modal-body__link" target="_blank">Read more...</a></p>
    <h3 class="modal-body__resources">Resources</h3>
            <ul class="modal-body__links">${item.links
              .map(
                (link) =>
                  `<li><a href="${link.link}" target="_blank">${link.name}</a></li>`
              )
              .join(" ")}</ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="modal-footer__button" data-bs-dismiss="modal" data-id="${
              item.id
            }"><i class="fa-solid fa-certificate" aria-hidden="true"></i>  Get badge</button>
          </div>
        </div>
      </div>
    </div>`;
    return modal;
  }

  displayItemsAmount(items) {
    allItemsAmount.innerText = items.length;
    itemsAmount = items.length;
  }

  getBadgeButtons() {
    const badgeButtons = [
      ...document.querySelectorAll(".modal-footer__button"),
    ];
    badgeButtonsDOM = badgeButtons;
    badgeButtons.forEach((button) => {
      let id = button.dataset.id;
      let collected = collectedBadges.find((item) => item.id == id);
      if (collected) {
        button.innerText = "Collected";
        button.disabled = true;
      }
      button.addEventListener("click", (e) => {
        e.target.innerText = "Collected";
        e.target.disabled = true;
        let badge = Storage.getItems(id);
        collectedBadges = [...collectedBadges, badge];
        Storage.saveBadges(collectedBadges);
        this.setCollectedItemsValue(collectedBadges);
        this.checkIfFinished();
        this.addBadge(badge);
        this.showBadges();
      });
    });
  }
  setCollectedItemsValue(collectedBadges) {
    collectedItemsAmount.innerText = collectedBadges.length;
  }
  addBadge(item) {
    let element = document.createElement("div");
    element.classList.add("badge");
    element.innerHTML = `
    <div class="badge__icon-container" title="${item.name}">
    <i class="${item.badge.icon} badge__icon" style="color:${item.badge.color}"  aria-hidden="true"></i>
  </div>
  <button class="badge__delete" data-id="${item.id}">
    <i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>
  </button>`;
    badgesRow.appendChild(element);
  }

  showBadges() {
    badgesContainer.classList.add("badges--show");
  }

  setupApp() {
    collectedBadges = Storage.getBadges();
    this.setCollectedItemsValue(collectedBadges);
    this.populateBadges(collectedBadges);
    this.registerEventListeners();
    this.checkIfFinished();
  }
  registerEventListeners() {
    let onboardingScreen = document.querySelector(".onboarding");
    onboardingBtn.addEventListener("click", () => {
      onboardingScreen.classList.add("removed");
    });
    onboardingScreen.addEventListener("transitionend", () => {
      onboardingScreen.remove();
    });
    toggleBadgesBtn.addEventListener("click", this.toggleBadges);
  }

  toggleBadges() {
    badgesContainer.classList.contains("badges--show")
      ? badgesContainer.classList.remove("badges--show")
      : badgesContainer.classList.add("badges--show");
  }

  populateBadges(badges) {
    badges.forEach((badge) => this.addBadge(badge));
  }

  badgesLogic() {
    removeAllBadgesBtn.addEventListener("click", () => {
      this.removeAllBadges();
    });
    badgesRow.addEventListener("click", (e) => {
      if (e.target.classList.contains("badge__delete")) {
        let removeItem = e.target;
        let removeItemId = removeItem.dataset.id;
        badgesRow.removeChild(removeItem.parentElement);
        this.removeItem(removeItemId);
      }
    });
  }

  removeAllBadges() {
    let badges = collectedBadges.map((item) => item.id);
    badges.forEach((id) => this.removeItem(id));
    while (badgesRow.children.length > 0) {
      badgesRow.removeChild(badgesRow.children[0]);
    }
  }

  removeItem(id) {
    collectedBadges = collectedBadges.filter((item) => item.id != id);
    this.setCollectedItemsValue(collectedBadges);
    Storage.saveBadges(collectedBadges);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML =
      '<i class="fa-solid fa-certificate" aria-hidden="true"></i> Get Badge';
  }

  getSingleButton(id) {
    return badgeButtonsDOM.find((btn) => btn.dataset.id == id);
  }
}

class Storage {
  static saveItems(items) {
    localStorage.setItem("items", JSON.stringify(items));
  }
  static getItems(id) {
    let items = JSON.parse(localStorage.getItem("items"));
    return items.find((item) => item.id == id);
  }
  static saveBadges(collectedBadges) {
    localStorage.setItem("collectedBadges", JSON.stringify(collectedBadges));
  }
  static getBadges() {
    return localStorage.getItem("collectedBadges")
      ? JSON.parse(localStorage.getItem("collectedBadges"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const items = new Items();

  ui.setupApp();

  items
    .getItems()
    .then((items) => {
      ui.displayItems(items);
      ui.displayItemsAmount(items);
      Storage.saveItems(items);
    })
    .then(() => {
      ui.getBadgeButtons();
      ui.badgesLogic();
    });
});
