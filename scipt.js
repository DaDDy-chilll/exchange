const api = "https://v6.exchangerate-api.com/v6/e41c051dffcbaa29f2cb0bc6";
const flagAPI = "https://restcountries.com/v3.1/currency";
const currentCurrency = {};
let collections;
let userClickCountryCode;
let countryInfo = {};
let userClickInfo = {};
let changeConvert = localStorage.getItem("changeConvert") || false;

(async () => {
  collections = localStorage.getItem("collections") || [
    {
      name: "Singapore Dollar",
      countryCode: "SGD",
    },
    {
      name: "Japanese Yen",
      countryCode: "JPY",
    },
    {
      name: "United States Dollar",
      countryCode: "USD",
    },
  ];

  if (changeConvert === "true") {
    $("#mainContainer").fadeOut(100);
    $("#innerContainer").fadeIn(130, () => startConvertor());
  } else await main();
  await alertCountriesList();
})();

async function useFetch(option) {
  return await fetch(`${api}/${option}`)
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(error);
    });
}

async function useFetchForFlag(code) {
  return await fetch(`${flagAPI}/${code}`)
    .then((res) => res.json())
    .catch((error) => {
      throw new Error(error);
    });
}

async function main() {
  const code = $("#countryCode").attr("value");
  const amount = +$("#inputPrice").val();
  userClickInfo.inputAmount = amount;
  userClickInfo.inputClickCode = code;
  userClickInfo.inputClickCodeSymbol = countryInfo[`${code}symbol`];
  localStorage.setItem("userClick", JSON.stringify(userClickInfo));
  currentCurrency.currentCurrencyCode = code;
  try {
    const rates = await useFetch(`latest/${code}`);
    const { conversion_rates } = rates;
    await fetchCountryInfo(conversion_rates);
    showDisplayRate(rates);
  } catch (error) {
    console.log(error);
  }
}

$("#inputPrice").blur(() => {
  const amount = +$("#inputPrice").val();
  userClickInfo.inputAmount = amount;
  showDisplayRate(currentCurrency, amount);
});

function showDisplayRate(countryInfo, inputPrice = 1) {
  $("#ratesContainer").empty();
  const { conversion_rates } = countryInfo;
  currentCurrency.conversion_rates = conversion_rates;
  currentCurrency.rateCountryCode = [];
  collections = JSON.parse(localStorage.getItem("collections")) || collections;
  collections.forEach(async (item) => {
    const { countryCode, name } = item;
    currentCurrency.rateCountryCode.push(countryCode);
    const response = await useFetchForFlag(countryCode);
    const { flags,currencies } = response[0];

    const element = `
        <div class="rate_card" onclick='rateClick("${countryCode}")'>
        <div class="flagPrice">
        <img src=${flags.png} alt="flag"  class="flag">
          <p class="price">${currencies[countryCode].symbol} ${
            parseInt(conversion_rates[countryCode] * inputPrice) > 0
              ? parseFloat(conversion_rates[countryCode] * inputPrice).toFixed(
                  2
                )
              : parseFloat(conversion_rates[countryCode] * inputPrice).toFixed(
                  4
                )
          }</p>
        </div>
        <p class="currency_code">${countryCode}</p>
        <p class="country_name">${name}</p>
      </div>
        `;

    $("#ratesContainer").append(element);
  });
}

function rateClick(countryCode) {
  userClickCountryCode = countryCode;
  userClickInfo.userClickCountry = countryCode;
  userClickInfo.userClickCountrySymbol = countryInfo[`${countryCode}symbol`];
  userClickInfo.inputClickCodeSymbol = countryInfo[`${userClickInfo.inputClickCode.toUpperCase()}symbol`];
  localStorage.setItem("userClick", JSON.stringify(userClickInfo));
  $("#rateOptionContainer").attr("active", "true");
}

async function alertCountriesList(change) {
  $("#countriesContainer").empty();
  const { supported_codes } = await useFetch("codes");
  const { rateCountryCode, currentCurrencyCode } = currentCurrency;
  if (change === "input") {
    userClickInfo.inputClickCode = currentCurrencyCode;
    userClickInfo.inputClickCodeSymbol = countryInfo[`${currentCurrencyCode}symbol`];
    localStorage.setItem("userClick", JSON.stringify(userClickInfo));
  }
  supported_codes.forEach(async (country) => {
    const [code, name] = country;
    let flagURL = countryInfo[code] || "./assets/nofoundflag.svg";
    let element;

    switch (change) {
      case "input":
        element = `
        <div class="country" onclick="countryClick('${code}/${name}')" active=${
          code == currentCurrencyCode.toUpperCase()
        }>
      <img src=${flagURL} alt="flag" width="12%" class="flag">
        <span class="country_info">
          <p>${code}</p>
          <p>${name}</p>
        </span>
     ${
       code == currentCurrencyCode.toUpperCase()
         ? '<img src="assets/success-icon.svg" alt="success" width="10%">'
         : ""
     }
      </div>
        `;
        break;
      case "add":
        element = `
        <div class="country" onclick="addCountry('${code}/${name}')" active=${rateCountryCode.includes(
          code
        )}>
      <img src=${flagURL} alt="flag" width="12%" class="flag">
        <span class="country_info">
          <p>${code}</p>
          <p>${name}</p>
        </span>
     ${
       rateCountryCode.includes(code)
         ? '<img src="assets/success-icon.svg" alt="success" width="10%">'
         : ""
     }
      </div>
        `;
        break;
      case "convertFirst":
        element = `
        <div class="country" onclick="convertCurrency('${code}/first')" active=${
          code == currentCurrencyCode.toUpperCase()
        }>
      <img src=${flagURL} alt="flag" width="12%" class="flag">
        <span class="country_info">
          <p>${code}</p>
          <p>${name}</p>
        </span>
     ${
       code == currentCurrencyCode.toUpperCase()
         ? '<img src="assets/success-icon.svg" alt="success" width="10%">'
         : ""
     }
      </div>
        `;
        break;
      case "convertSecond":
        element = `
          <div class="country" onclick="convertCurrency('${code}/second')" active=${
          code == currentCurrencyCode.toUpperCase()
        }>
        <img src=${flagURL} alt="flag" width="12%" class="flag">
          <span class="country_info">
            <p>${code}</p>
            <p>${name}</p>
          </span>
       ${
         code == currentCurrencyCode.toUpperCase()
           ? '<img src="assets/success-icon.svg" alt="success" width="10%">'
           : ""
       }
        </div>
          `;
        break;
      default:
        break;
    }
    $("#countriesContainer").append(element);
  });
}

async function countryClick(country) {
  const code = country.split("/")[0];
  currentCurrency.currentCurrencyCode = code;
  const response = await useFetch(`latest/${code}`);
  $("#countryCode").text(code);
  $("#alertContainer").fadeOut(100);
  const amount = +$("#inputPrice").val();
  showDisplayRate(response, amount);
  userClickInfo.inputClickCode = code;
  console.log(countryInfo[`${code}symbol`]);
  userClickInfo.inputClickCodeSymbol = countryInfo[`${code}symbol`];
  localStorage.setItem("userClick", JSON.stringify(userClickInfo));
}

async function addCountry(country) {
  const [code, name] = country.split("/");
  let newData = [];
  collections.forEach((item) => newData.push(item));
  newData.push({ name, countryCode: code });
  const data = new Map(newData.map((c) => [c.countryCode, c]));
  const uniqueData = [...data.values()];
  localStorage.setItem("collections", JSON.stringify(uniqueData));
  $("#alertContainer").fadeOut(100);
  await main();
}

$("#DeleteBtn").click(async () => {
  let newData = collections.filter(
    (item) => item.countryCode !== userClickCountryCode
  );
  const data = new Map(newData.map((c) => [c.countryCode, c]));
  const uniqueData = [...data.values()];
  localStorage.setItem("collections", JSON.stringify(uniqueData));
  $("#rateOptionContainer").attr("active", "false");
  await main();
});

$("#viewContainer").click(() =>
  $("#mainContainer").fadeOut(125, () =>
    $("#innerContainer").fadeIn(130, () => {
      startConvertor();
      localStorage.setItem("changeConvert", true);
      $("#rateOptionContainer").attr("active", "false");
    })
  )
);

function fetchCountryInfo(conversion_rates) {
  Object.keys(conversion_rates).forEach(async (code) => {
    if (!["0", "1", "2", "HRK", "SLE", "XDR"].includes(code)) {
      const response = await useFetchForFlag(code);
      const { flags,currencies } = response[0];
      countryInfo[code] = flags.png;
      countryInfo[`${code}symbol`] = currencies[code].symbol;
    }
  });
}

$("#cancelBtn").click(() => $("#rateOptionContainer").attr("active", "false"));
$("#closeBtn").click(() => $("#alertContainer").fadeOut(100));
$("#inputCurrency").click(() =>
  $("#alertContainer").fadeIn(100, () => alertCountriesList("input"))
);
$("#addMore").click(() =>
  $("#alertContainer").fadeIn(100, () => alertCountriesList("add"))
);

$("#backBtn").click(() => {
  $("#innerContainer").fadeOut(200, () => {
    localStorage.setItem("changeConvert", false);
    $("#mainContainer").fadeIn(202, () => main());
  });
});

//! Converter Section

async function startConvertor() {
  const { inputAmount, inputClickCode,inputClickCodeSymbol, userClickCountry,userClickCountrySymbol } = JSON.parse(
    localStorage.getItem("userClick")
  );

  const { conversion_rates } = await useFetch(`latest/${inputClickCode}`);
  currentCurrency.conversion_rates = conversion_rates;
  userClickInfo.inputAmount = inputAmount;
  userClickInfo.inputClickCode = inputClickCode;
  userClickInfo.inputClickCodeSymbol = inputClickCodeSymbol;
  userClickInfo.userClickCountry = userClickCountry;
  userClickInfo.userClickCountrySymbol = userClickCountrySymbol;
  $("#currentCurrency").val(inputAmount);
  $('#inputSymbol').text(inputClickCodeSymbol)
  $("#firstCurrencyName").text(inputClickCode);
  $("#secondCurrencyName").text(userClickCountry);
  convertPrice(inputAmount);
}

$("#currentCurrency").blur(() => {
  const inputAmount = $("#currentCurrency").val();
  convertPrice(inputAmount);
});

function convertPrice(amount) {
  const { conversion_rates } = currentCurrency;
  const resultPrice = parseFloat(
    amount * conversion_rates[userClickInfo.userClickCountry]
  ).toFixed(3);
  $("#resultCurrency").text(`${resultPrice} ${userClickInfo.userClickCountrySymbol}`);
}

$("#convertorFirst").click(() => {
  currentCurrency.currentCurrencyCode = userClickInfo.inputClickCode;
  $("#alertContainer").fadeIn(100, () => alertCountriesList("convertFirst"));
});

$("#convertorSecond").click(() => {
  currentCurrency.currentCurrencyCode = userClickInfo.userClickCountry;
  $("#alertContainer").fadeIn(100, () => alertCountriesList("convertSecond"));
});

async function convertCurrency(data) {
  const [code, type] = data.split("/");
  if (type === "first") {
    $("#firstCurrencyName").text(code);
    userClickInfo.inputClickCode = code;
    userClickInfo.inputClickCodeSymbol =  countryInfo[`${code}symbol`];
  } else {
    $("#secondCurrencyName").text(code);
    userClickInfo.userClickCountry = code;
    userClickInfo.userClickCountrySymbol =  countryInfo[`${code}symbol`];

  }
  localStorage.setItem("userClick", JSON.stringify(userClickInfo));
  $("#alertContainer").fadeOut(100, () => startConvertor());
}
