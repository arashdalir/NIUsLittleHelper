
// berechnet aus der angegebenen Zeitspanne im NIU (zb 18:00 - 00:00)
// die Dauer in Stunden
// currentDateString: das im NIU verwendete Datum eg. "19.03.2017"
// timeString: im Niu verwendete Zeitpsanne eg "18:00 - 00:00"
// returns hours (float)
function getDurationFromTimeString(currentDateString, timeString) {
  var startTime = timeString.substring(0, 6);
  var stopTime = timeString.substring(8, 15).trim();
  var pattern = /(\d{2})\.(\d{2})\.(\d{4})/;
  startDate = new Date(currentDateString.replace(pattern,'$3-$2-$1 ') + startTime);
  stopDate = new Date(currentDateString.replace(pattern,'$3-$2-$1 ') + stopTime);
  if (stopDate <= startDate) {
    stopDate.setDate(stopDate.getDate() + 1);  // add one day if dienst ends on the next day
  };
  var hours = Math.abs(stopDate - startDate) / 36e5;
  return hours;
}

// liest die verfügbaren Funktionen aus der Dienstplan-Tabelle aus
// header: jquery object of table header tr
function getDuties(header) {
  duties = {};
  header.find('td').each(function(key, val) {
    if ($(val).hasClass('DRCShift')) {
      duties[key.toString()] = $(val).text();
    }
  });
  return duties;
}

// holt die verfügbaren MitarbeiterInnenDaten
function scrapeEmployee(jqObj, employeeLink) {

  // Name
  var nameString = $(jqObj).find('#ctl00_main_shortEmpl_EmployeeName').text().trim();
  var nameFull = nameString.substring(0, nameString.indexOf('(')).trim();
  var nameArr = nameFull.split(/\s+/);
  var nameFirst = nameArr.slice(0, -1).join(' ');
  var nameLast = nameArr.pop();
  var dienstnummer = nameString.substring(nameString.indexOf('(') + 1, nameString.indexOf(')'));

  var employee = {
    FN: nameFull,
    N: nameLast + ';' + nameFirst + ';;;',
    ORG: 'Österreichisches Rotes Kreuz - Landesverband Wien',
    PROFILE: 'VCARD',
    TZ: '+0100',
    URL: window.location.href,
    REV: new Date().toISOString(),
    CATEGORIES: 'WRK,ÖRK',
    NOTE: 'WRK Dienstnummer: ' + dienstnummer,
  }

  console.log('Scraped:' + employee.FN + '(' + dienstnummer + ')');

  // Foto
  var imageSrc = new URL($($(jqObj).find('#ctl00_main_shortEmpl_EmployeeImage')[0]).attr('src'), employeeLink);
  employee['PHOTO;TYPE=PNG'] = imageSrc.href;  // photo with url

  // query url for the UID
  $.urlParam = function () {
    var name = 'EmployeeID';
    if (employeeLink.includes('EmployeeNumberID')) {
      name = 'EmployeeNumberID';
    }
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(employeeLink);
    return results[1] || 0;
  }
  employee.UID = 'urn:uuid:' + $.urlParam();

  // Kontaktmöglichkeiten
  $(jqObj).find('table#ctl00_main_shortEmpl_contacts_m_tblPersonContactMain tbody tr[id]').each(function () {
    var key;
    switch ($($(this).find('span[id]')[0]).text().split(' ')[0]) {
      case 'Telefon':
        key = 'TEL;';
        break;
      case 'Handy':
      case 'Bereitschaft':
        key = 'TEL;TYPE=cell;'
        break;
      case 'Fax':
        key = 'TEL;TYPE=fax;'
        break;
      case 'e-mail':
        key = 'EMAIL;TYPE=internet;'
        break;
      default:
        break;
    }
    switch ($($(this).find('span[id]')[0]).text().split(' ')[1]) {
      case 'geschäftlich':
      case 'WRK':
        key += 'TYPE=work;';
        break;
      case 'private':
        key += 'TYPE=home';
        break;
      default:
        break;
    }
    if (key) {  // ignore Notruf Pager
      employee[key.substring(0, key.length - 1)] = $($(this).find('span[id]')[1]).text().trim();
    }
  });

  // Funktionen/Berechtigungen
  $('.PermissionRow').each(function () {
    employee.NOTE += '\\n' + $(this).find('.PermissionType').text().trim() + ': ' + $(this).find('.PermissionName').text().trim();
  });

  // store employee locally
  var obj = {};
  obj[employeeLink] = employee;
  chrome.storage.local.set(obj, function() {
    console.log(employeeLink + ' locally stored.');
  });

  return employee;
}
