import mongoose, { Schema, Document } from 'mongoose';

export interface IProduto extends Document {
  _id: mongoose.Types.ObjectId;
  codigo: string;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  imagem?: string;
  categoria: string;
  cor: string;
  modelo: string;
  peso: number;
  largura: number;
  altura: number;
  comprimento: number;
  frete?: number;
}

const ProdutoSchema = new Schema<IProduto>({
  codigo: { type: String, required: true },
  nome: { type: String, required: true },
  descricao: { type: String, required: true },
  preco: { type: Number, required: true },
  estoque: { type: Number, required: true },
  imagem: { type: String },
  categoria: { type: String, required: true },
  cor: { type: String, required: true },
  modelo: { type: String, required: true },
  peso: { type: Number, required: true },
  largura: { type: Number, required: true },
  altura: { type: Number, required: true },
  comprimento: { type: Number, required: true },
  frete: { type: Number },
});

export const ProdutoModel =
  mongoose.models.Produto || mongoose.model<IProduto>('produtos', ProdutoSchema);