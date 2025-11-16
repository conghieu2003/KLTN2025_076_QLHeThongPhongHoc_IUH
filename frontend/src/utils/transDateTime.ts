import dayjs, { Dayjs } from 'dayjs';

/**
 * Chuyển đổi Date để xử lý múi giờ (UTC+7 cho Việt Nam)
 * Điều chỉnh timezone offset để đảm bảo ngày giờ chính xác
 */
export const TransDateTime = (date?: Date | string | Dayjs): Date | undefined => {
  if (!date) {
    return undefined;
  }

  // Chuyển đổi sang Date nếu là string hoặc Dayjs
  let dateObj: Date;
  if (dayjs.isDayjs(date)) {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Kiểm tra nếu không phải Date hợp lệ
  if (isNaN(dateObj.getTime())) {
    return undefined;
  }

  // Điều chỉnh timezone offset (UTC+7 = -420 phút)
  // getTimezoneOffset() trả về số phút offset từ UTC
  // Ví dụ: UTC+7 sẽ có getTimezoneOffset() = -420
  // Chúng ta cần điều chỉnh để đảm bảo ngày giờ chính xác
  return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
};

/**
 * Lấy tuần từ ngày hiện tại
 * Thứ Hai là ngày đầu tiên của tuần
 */
export const getWeekFromCurrentDate = () => {
  const currentDate = new Date();
  
  // Tính ngày bắt đầu của tuần (Thứ Hai là ngày đầu tiên của tuần)
  const firstDayOfWeek = new Date(currentDate);
  const dayOfWeek = currentDate.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Chủ nhật lùi 6 ngày, các ngày khác lùi (dayOfWeek - 1)
  firstDayOfWeek.setDate(currentDate.getDate() - daysToSubtract);
  firstDayOfWeek.setHours(0, 0, 0, 0);
  
  // Tính ngày cuối tuần (Chủ Nhật là ngày cuối cùng của tuần)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  
  return { firstDayOfWeek, lastDayOfWeek };
};

/**
 * Lấy năm từ ngày hiện tại
 */
export const getYearFromCurrentDate = () => {
  const currentDate = new Date();
  const fullYear = currentDate.getFullYear();
  
  const firstDayOfYear = new Date(fullYear, 0, 1, 0, 0, 0);
  const lastDayOfYear = new Date(fullYear, 11, 31, 23, 59, 59, 999);
  
  return { firstDayOfYear, lastDayOfYear };
};

/**
 * Kiểm tra xem Date có chứa thời gian (giờ, phút, giây) hay không
 */
export const hasTime = (dateObject: Date): boolean => {
  const hasTime = dateObject.getHours() !== 0 || 
                  dateObject.getMinutes() !== 0 || 
                  dateObject.getSeconds() !== 0 || 
                  dateObject.getMilliseconds() !== 0;
  return hasTime;
};

/**
 * So sánh thời gian giữa hai Date
 * @returns -1 nếu time_from < time_to, 1 nếu time_from > time_to, 0 nếu bằng nhau, undefined nếu không hợp lệ
 */
export const compareTimes = (time_from?: Date, time_to?: Date): number | undefined => {
  if (!time_from || !time_to) {
    return undefined;
  }

  // Kiểm tra nếu là Date hợp lệ
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

/**
 * Loại bỏ thời gian (giờ, phút, giây, milliseconds) từ Date
 * Chỉ giữ lại ngày, tháng, năm
 */
export const removeTime = (date?: Date): Date | undefined => {
  if (date === undefined || date === null) {
    return undefined;
  }

  if (isNaN(date.getTime())) {
    return undefined;
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Format Date sang string YYYY-MM-DD với xử lý timezone
 */
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

/**
 * Parse string date từ API (YYYY-MM-DD) sang Date với xử lý timezone
 */
export const parseDateFromAPI = (dateString?: string): Date | undefined => {
  if (!dateString) {
    return undefined;
  }

  // Tạo Date từ string, sau đó điều chỉnh timezone
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
    // Parse time string (có thể là "HH:mm:ss" hoặc "HH:mm")
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) {
      return timeString;
    }

    let hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    // Kiểm tra nếu không phải số hợp lệ
    if (isNaN(hours) || isNaN(minutes)) {
      return timeString;
    }

    // Trừ đi 7 giờ để chuyển từ UTC sang UTC+7 (Vietnam time)
    hours = hours - 8;

    // Xử lý trường hợp âm (ví dụ: 2:10 UTC -> 19:10 UTC+7 ngày hôm trước)
    if (hours < 0) {
      hours = hours + 24;
    }

    // Format lại với 2 chữ số
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

