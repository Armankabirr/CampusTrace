import mongoose from 'mongoose';

const ALLOWED_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@bscse\.uiu\.ac\.bd$/i;
const PHONE_REGEX = /^(?:\+8801|01)[3-9]\d{8}$/;

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100,
			alias: 'fullName',
		},
		studentId: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			minlength: 3,
			maxlength: 30,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			match: [
				ALLOWED_DOMAIN_REGEX,
				'Only UIU CSE university email (@bscse.uiu.ac.bd) is allowed.',
			],
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			match: [PHONE_REGEX, 'Please provide a valid Bangladeshi phone number.'],
		},
		location: {
			type: String,
			trim: true,
			default: 'Dhaka, Bangladesh',
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		role: {
			type: String,
			enum: ['student', 'moderator', 'fraud_investigator', 'admin', 'super_admin'],
			default: 'student',
		},
		accountStatus: {
			type: String,
			enum: ['active', 'suspended', 'deleted'],
			default: 'active',
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
		suspendedAt: {
			type: Date,
			default: null,
		},
		suspensionReason: {
			type: String,
			default: null,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
