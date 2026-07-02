
/**
 * Utility to safely format dates entered in the CMS to prevent 
 * timezone shifts (IST vs UTC).
 * 
 * Requirements:
 * - Fix apply only for new entries (or formatted displays)
 * - Display date using 'en-GB' format (DD/MM/YYYY)
 * - Use 'Asia/Kolkata' timezone to prevent -1 day shift
 */

export const formatDateSafe = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";

  try {
    // If it's already a full ISO string, extract just the date part (YYYY-MM-DD)
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
    // Check if it's a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      // Fallback for non-standard formats, try to parse normally
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata'
      });
    }

    // Fix: Append T12:00:00 to prevent timezone conversion from shifting the day back
    const date = new Date(cleanDate + "T12:00:00");
    
    return date.toLocaleDateString('en-GB', {
      timeZone: 'Asia/Kolkata'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr || "";
  }
};

/**
 * Normalizes a date to midday to prevent timezone shifts when saving or processing.
 */
export const normalizeDateForSave = (inputDate: string | Date): string => {
  if (!inputDate) return "";
  
  if (typeof inputDate === 'string') {
    // If it's already a date-only string (YYYY-MM-DD), keep it as is for storage
    if (/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
      return inputDate;
    }
  }

  const date = new Date(inputDate);
  if (isNaN(date.getTime())) return String(inputDate);
  
  // Set to midday to be safe against any timezone shifts
  date.setHours(12, 0, 0, 0);
  
  // Return as ISO string date part
  return date.toISOString().split('T')[0];
};
