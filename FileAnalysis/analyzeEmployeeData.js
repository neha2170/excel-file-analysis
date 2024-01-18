const fs = require("fs");
const xlsx = require("xlsx");

function analyzeEmployeeData(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  //convert time strings to minutes
  function convertTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // consecutive days
  function checkConsecutiveDays(employeeName, shifts) {
    shifts.sort(
      (a, b) =>
        new Date(a["Pay Cycle Start Date"]) -
        new Date(b["Pay Cycle Start Date"])
    );

    for (let i = 0; i < shifts.length - 6; i++) {
      const startDate = new Date(shifts[i]["Pay Cycle Start Date"]);
      const endDate = new Date(shifts[i + 6]["Pay Cycle End Date"]);
      const timeDifference = endDate - startDate;
      const daysDifference = timeDifference / (1000 * 3600 * 24);

      if (daysDifference === 7) {
        console.log(`${employeeName} has worked for 7 consecutive days.`);
        break;
      }
    }
  }

  //time between shifts and single shift duration
  function checkShiftTimings(employeeName, shifts) {
    for (let i = 0; i < shifts.length - 1; i++) {
      const endTimeFirstShift = new Date(shifts[i]["Time Out"]);
      const startTimeNextShift = new Date(shifts[i + 1]["Time"]);
      const timeDifference = startTimeNextShift - endTimeFirstShift;
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference > 1 && hoursDifference < 10) {
        console.log(
          `${employeeName} has less than 10 hours but greater than 1 hour between shifts.`
        );
      }

      const shiftDuration = convertTimeToMinutes(
        shifts[i]["Timecard Hours (as Time)"]
      );
      if (shiftDuration > 840) {
        console.log(
          `${employeeName} has worked for more than 14 hours in a single shift.`
        );
      }
    }
  }

  // Group shifts by employee name
  const shiftsByEmployee = {};
  data.forEach((shift) => {
    const employeeName = shift["Employee Name"];
    if (!shiftsByEmployee[employeeName]) {
      shiftsByEmployee[employeeName] = [];
    }
    shiftsByEmployee[employeeName].push(shift);
  });

  // Analyze each employee's shifts
  for (const employeeName in shiftsByEmployee) {
    const shifts = shiftsByEmployee[employeeName];
    checkConsecutiveDays(employeeName, shifts);
    checkShiftTimings(employeeName, shifts);
  }
}

const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide the file path as a command line argument.");
} else {
  console.log(`Analyzing file: ${filePath}`);
  analyzeEmployeeData(filePath);
}

module.exports = analyzeEmployeeData;
