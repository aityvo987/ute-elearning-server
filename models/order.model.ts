import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    courseIds: string[];
    userId: string;
    payment_info: object;
}

const orderSchema = new Schema<IOrder>({
    courseIds: {
        type: [String],
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    payment_info: {
        type: Object,
        // required: true
    },
}, { timestamps: true });

const OrderModel: Model<IOrder> = mongoose.model('Order', orderSchema);

export default OrderModel;