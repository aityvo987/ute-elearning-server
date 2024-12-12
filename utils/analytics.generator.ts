import { Document, Model } from "mongoose";

// Định nghĩa giao diện cho dữ liệu tháng
interface MonthData {
    month: string; // Tên tháng (ví dụ: "Sep 2023")
    count: number; // Số lượng document được tạo trong tháng đó
}

/**
 * Hàm này tạo dữ liệu cho 12 tháng gần nhất, đếm số lượng document được tạo mỗi tháng.
 * @param model - Mô hình Mongoose để truy vấn.
 * @returns Một đối tượng chứa mảng `last12Months` với dữ liệu cho 12 tháng gần nhất.
 */
export async function generateLast12MonthData<T extends Document>(
    model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
    const last12Months: MonthData[] = []; // Khởi tạo mảng để lưu trữ dữ liệu các tháng
    const currentDate = new Date(); // Lấy ngày hiện tại
    currentDate.setDate(currentDate.getDate() + 1); // Tăng ngày hiện tại lên 1 để bao gồm ngày hôm nay trong đếm

    // Vòng lặp lấy 12 tháng gần nhất
    for (let i = 11; i >= 0; i--) {
        // Tính toán ngày kết thúc cho tháng hiện tại trong vòng lặp
        const endDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - i * 28 // Trừ 28 ngày để định nghĩa ngày kết thúc
        );

        // Tính toán ngày bắt đầu cho tháng hiện tại trong vòng lặp
        const startDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate() - 28 // Trừ thêm 28 ngày để định nghĩa ngày bắt đầu
        );

        // Định dạng lại ngày kết thúc thành chuỗi tháng-năm (ví dụ: "Sep 2023")
        const monthYear = endDate.toLocaleString("default", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

        // Đếm số lượng document được tạo giữa ngày bắt đầu và ngày kết thúc
        const count = await model.countDocuments({
            createdAt: { $gte: startDate, $lt: endDate },
        });

        // Thêm dữ liệu vào mảng `last12Months`
        last12Months.push({ month: monthYear, count });
    }

    return { last12Months };
}
