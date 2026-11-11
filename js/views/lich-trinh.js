export const defaultViewDate = (t, now) => (now.date < t.start ? t.start : now.date > t.end ? t.end : now.date);
export const renderItinerary = () => '<h1 class="view-h">Lịch trình</h1>';
export const mountItinerary = () => {};
