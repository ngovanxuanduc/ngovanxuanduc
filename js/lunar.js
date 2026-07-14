/**
 * Âm lịch Việt Nam — chuyển đổi Dương ↔ Âm
 * Thuật toán dựa trên công trình phổ biến (Ho Ngọc Đức / Jean Meeus).
 * Timezone mặc định: UTC+7 (Việt Nam).
 */
(function (global) {
  "use strict";

  var PI = Math.PI;
  var CAN = [
    "Giáp",
    "Ất",
    "Bính",
    "Đinh",
    "Mậu",
    "Kỷ",
    "Canh",
    "Tân",
    "Nhâm",
    "Quý",
  ];
  var CHI = [
    "Tý",
    "Sửu",
    "Dần",
    "Mão",
    "Thìn",
    "Tỵ",
    "Ngọ",
    "Mùi",
    "Thân",
    "Dậu",
    "Tuất",
    "Hợi",
  ];
  var THANG_AM = [
    "Giêng",
    "Hai",
    "Ba",
    "Tư",
    "Năm",
    "Sáu",
    "Bảy",
    "Tám",
    "Chín",
    "Mười",
    "Một",
    "Chạp",
  ];
  var THU = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  var THU_FULL = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  var THANG_DUONG = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  function INT(d) {
    return Math.floor(d);
  }

  function jdFromDate(dd, mm, yy) {
    var a = INT((14 - mm) / 12);
    var y = yy + 4800 - a;
    var m = mm + 12 * a - 3;
    var jd =
      dd +
      INT((153 * m + 2) / 5) +
      365 * y +
      INT(y / 4) -
      INT(y / 100) +
      INT(y / 400) -
      32045;
    if (jd < 2299161) {
      jd =
        dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    }
    return jd;
  }

  function jdToDate(jd) {
    var a, b, c, d, e, m, day, month, year;
    if (jd > 2299160) {
      a = jd + 32044;
      b = INT((4 * a + 3) / 146097);
      c = a - INT((b * 146097) / 4);
    } else {
      b = 0;
      c = jd + 32082;
    }
    d = INT((4 * c + 3) / 1461);
    e = c - INT((1461 * d) / 4);
    m = INT((5 * e + 2) / 153);
    day = e - INT((153 * m + 2) / 5) + 1;
    month = m + 3 - 12 * INT(m / 10);
    year = b * 100 + d - 4800 + INT(m / 10);
    return [day, month, year];
  }

  function NewMoon(k) {
    var T = k / 1236.85;
    var T2 = T * T;
    var T3 = T2 * T;
    var dr = PI / 180;
    var Jd1 =
      2415020.75933 +
      29.53058868 * k +
      0.0001178 * T2 -
      0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M =
      359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mpr =
      306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F =
      21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var C1 =
      (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
      0.0021 * Math.sin(2 * dr * M);
    C1 =
      C1 -
      0.4068 * Math.sin(Mpr * dr) +
      0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 =
      C1 +
      0.0104 * Math.sin(dr * 2 * F) -
      0.0051 * Math.sin(dr * (M + Mpr));
    C1 =
      C1 -
      0.0074 * Math.sin(dr * (M - Mpr)) +
      0.0004 * Math.sin(dr * (2 * F + M));
    C1 =
      C1 -
      0.0004 * Math.sin(dr * (2 * F - M)) -
      0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 =
      C1 +
      0.001 * Math.sin(dr * (2 * F - Mpr)) +
      0.0005 * Math.sin(dr * (2 * Mpr + M));
    var deltat;
    if (T < -11) {
      deltat =
        0.001 +
        0.000839 * T +
        0.0002261 * T2 -
        0.00000845 * T3 -
        0.000000081 * T * T3;
    } else {
      deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    }
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn) {
    var T = (jdn - 2451545.0) / 36525;
    var T2 = T * T;
    var dr = PI / 180;
    var M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    var DL =
      (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL =
      DL +
      (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
      0.00029 * Math.sin(dr * 3 * M);
    var L = L0 + DL;
    L = L * dr;
    L = L - PI * 2 * INT(L / (PI * 2));
    return L;
  }

  function getSunLongitude(dayNumber, timeZone) {
    return INT((SunLongitude(dayNumber - 0.5 - timeZone / 24) / PI) * 6);
  }

  function getNewMoonDay(k, timeZone) {
    return INT(NewMoon(k) + 0.5 + timeZone / 24);
  }

  function getLunarMonth11(yy, timeZone) {
    var off = jdFromDate(31, 12, yy) - 2415021;
    var k = INT(off / 29.530588853);
    var nm = getNewMoonDay(k, timeZone);
    var sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) {
      nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
  }

  function getLeapMonthOffset(a11, timeZone) {
    var k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    var last = 0;
    var i = 1;
    var arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  /**
   * @returns {{ day: number, month: number, year: number, leap: number, jd: number }}
   */
  function convertSolar2Lunar(dd, mm, yy, timeZone) {
    timeZone = timeZone == null ? 7 : timeZone;
    var dayNumber = jdFromDate(dd, mm, yy);
    var k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    var monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = getNewMoonDay(k, timeZone);
    }
    var a11 = getLunarMonth11(yy, timeZone);
    var b11 = a11;
    var lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    var lunarDay = dayNumber - monthStart + 1;
    var diff = INT((monthStart - a11) / 29);
    var lunarLeap = 0;
    var lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      var leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = 1;
        }
      }
    }
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }
    return {
      day: lunarDay,
      month: lunarMonth,
      year: lunarYear,
      leap: lunarLeap,
      jd: dayNumber,
    };
  }

  function getCanChiYear(year) {
    return CAN[(year + 6) % 10] + " " + CHI[(year + 8) % 12];
  }

  function getCanChiMonth(lunarMonth, lunarYear) {
    return (
      CAN[(lunarYear * 12 + lunarMonth + 3) % 10] +
      " " +
      CHI[(lunarMonth + 1) % 12]
    );
  }

  function getCanChiDay(jd) {
    return CAN[(jd + 9) % 10] + " " + CHI[(jd + 1) % 12];
  }

  function formatLunarLabel(lunar) {
    var day = lunar.day;
    var monthName = THANG_AM[lunar.month - 1] || String(lunar.month);
    var leap = lunar.leap ? " (nhuận)" : "";
    if (day === 1) {
      return "1/" + lunar.month + leap;
    }
    return String(day);
  }

  function formatLunarFull(lunar) {
    var leap = lunar.leap ? " nhuận" : "";
    return (
      "Ngày " +
      lunar.day +
      " tháng " +
      lunar.month +
      leap +
      " năm " +
      getCanChiYear(lunar.year) +
      " (" +
      lunar.year +
      ")"
    );
  }

  /**
   * Thông tin đầy đủ cho một ngày dương lịch.
   */
  function getDayInfo(dd, mm, yy, timeZone) {
    timeZone = timeZone == null ? 7 : timeZone;
    var lunar = convertSolar2Lunar(dd, mm, yy, timeZone);
    var jd = lunar.jd;
    var date = new Date(yy, mm - 1, dd);
    var dow = date.getDay();
    return {
      solar: { day: dd, month: mm, year: yy },
      lunar: lunar,
      weekday: dow,
      weekdayName: THU_FULL[dow],
      weekdayShort: THU[dow],
      canChiYear: getCanChiYear(lunar.year),
      canChiMonth: getCanChiMonth(lunar.month, lunar.year),
      canChiDay: getCanChiDay(jd),
      lunarLabel: formatLunarLabel(lunar),
      lunarFull: formatLunarFull(lunar),
      isTetEve: lunar.month === 12 && (lunar.day === 29 || lunar.day === 30),
      isTet: lunar.month === 1 && lunar.day === 1 && lunar.leap === 0,
      isRam: lunar.day === 15,
      isMung1: lunar.day === 1,
    };
  }

  /**
   * Tết Âm lịch kế tiếp: 00:00 ngày mùng 1 tháng Giêng (không nhuận).
   * @returns {{ date: Date, lunarYear: number, canChiYear: string, solar: {day,month,year} }}
   */
  function getNextLunarNewYear(fromDate) {
    fromDate = fromDate || new Date();
    var start = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate()
    );
    var i;
    for (i = 0; i < 450; i++) {
      var check = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var dd = check.getDate();
      var mm = check.getMonth() + 1;
      var yy = check.getFullYear();
      var lunar = convertSolar2Lunar(dd, mm, yy, 7);
      if (lunar.day === 1 && lunar.month === 1 && lunar.leap === 0) {
        var target = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
        if (target > fromDate) {
          return {
            date: target,
            lunarYear: lunar.year,
            canChiYear: getCanChiYear(lunar.year),
            solar: { day: dd, month: mm, year: yy },
          };
        }
      }
    }
    // fallback hiếm
    var fb = new Date(fromDate.getFullYear() + 1, 0, 1);
    return {
      date: fb,
      lunarYear: fromDate.getFullYear() + 1,
      canChiYear: getCanChiYear(fromDate.getFullYear() + 1),
      solar: { day: 1, month: 1, year: fromDate.getFullYear() + 1 },
    };
  }

  function getMonthMatrix(year, month) {
    // month: 1-12
    var first = new Date(year, month - 1, 1);
    var startDow = first.getDay(); // 0 = CN
    var daysInMonth = new Date(year, month, 0).getDate();
    var cells = [];
    var i;
    for (i = 0; i < startDow; i++) {
      cells.push(null);
    }
    for (i = 1; i <= daysInMonth; i++) {
      cells.push(getDayInfo(i, month, year));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }

  global.LunarVN = {
    convertSolar2Lunar: convertSolar2Lunar,
    getDayInfo: getDayInfo,
    getMonthMatrix: getMonthMatrix,
    getNextLunarNewYear: getNextLunarNewYear,
    getCanChiYear: getCanChiYear,
    getCanChiMonth: getCanChiMonth,
    getCanChiDay: getCanChiDay,
    THU: THU,
    THU_FULL: THU_FULL,
    THANG_DUONG: THANG_DUONG,
    THANG_AM: THANG_AM,
    CAN: CAN,
    CHI: CHI,
    TIMEZONE: 7,
  };
})(typeof window !== "undefined" ? window : globalThis);
