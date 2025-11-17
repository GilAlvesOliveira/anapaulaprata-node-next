import mongoose, { Schema, Document } from 'mongoose';

export interface IUsuario extends Document {
  nome: string;
  email: string;
  senha?: string;
  avatar?: string;
  role: 'admin' | 'customer';
  telefone?: string;
  endereco?: string;
  cep?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UsuarioSchema = new Schema<IUsuario>({
  nome: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  senha: { type: String, required: false },
  avatar: { type: String },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  telefone: { type: String },
  endereco: { type: String },
  cep: { type: String, required: false },
  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false },
});

export const UsuarioModel =
  mongoose.models.Usuario || mongoose.model<IUsuario>('usuarios', UsuarioSchema);
