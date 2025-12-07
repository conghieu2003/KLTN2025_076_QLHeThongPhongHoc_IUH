import dayjs, { Dayjs } from 'dayjs';

export const TransDateTime = (date?: Date | string | Dayjs): Date | undefined => {
  if (!date) {
    return undefined;
  }
  let dateObj: Date;
  if (dayjs.isDayjs(date)) {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return undefined;
  }

  return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
};

export const getWeekFromCurrentDate = () => {
  const currentDate = new Date();
  
  const firstDayOfWeek = new Date(currentDate);
  const dayOfWeek = currentDate.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  firstDayOfWeek.setDate(currentDate.getDate() - daysToSubtract);
  firstDayOfWeek.setHours(0, 0, 0, 0);
  
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  
  return { firstDayOfWeek, lastDayOfWeek };
};

export const getYearFromCurrentDate = () => {
  const currentDate = new Date();
  const fullYear = currentDate.getFullYear();
  
  const firstDayOfYear = new Date(fullYear, 0, 1, 0, 0, 0);
  const lastDayOfYear = new Date(fullYear, 11, 31, 23, 59, 59, 999);
  
  return { firstDayOfYear, lastDayOfYear };
};

export const hasTime = (dateObject: Date): boolean => {
  const hasTime = dateObject.getHours() !== 0 || 
                  dateObject.getMinutes() !== 0 || 
                  dateObject.getSeconds() !== 0 || 
                  dateObject.getMilliseconds() !== 0;
  return hasTime;
};

export const compareTimes = (time_from?: Date, time_to?: Date): number | undefined => {
  if (!time_from || !time_to) {
    return undefined;
  }

  if (isNaN(time_from.getTime()) || isNaN(time_to.getTime())) {
    return undefined;
  }

  const from = new Date(time_from);
  from.setMilliseconds(0);
  
  const to = new Date(time_to);
  to.setMilliseconds(0);

  if (from.getTime() < to.getTime()) {
    return -1;
  } else if (from.getTime() > to.getTime()) {
    return 1;
  } else {
    return 0;
  }
};

export const removeTime = (date?: Date): Date | undefined => {
  if (date === undefined || date === null) {
    return undefined;
  }

  if (isNaN(date.getTime())) {
    return undefined;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatDateForAPI = (date?: Date | string | Dayjs): string | undefined => {
  if (!date) {
    return undefined;
  }

  const transDate = TransDateTime(date);
  if (!transDate) {
    return undefined;
  }

  const year = transDate.getFullYear();
  const month = String(transDate.getMonth() + 1).padStart(2, '0');
  const day = String(transDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const parseDateFromAPI = (dateString?: string): Date | undefined => {
  if (!dateString) {
    return undefined;
  }

  const date = new Date(dateString + 'T00:00:00');
  
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return TransDateTime(date);
};

export const formatTimeFromAPI = (timeString?: string): string => {
  if (!timeString) {
    return '';
  }

  try {
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) {
      return timeString;
    }

    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return timeString;
    }

    hours = hours - 8;

    if (hours < 0) {
      hours = hours + 24;
    }

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

