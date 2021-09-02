import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage

    // if (storagedCart) {
    //   return JSON.parse(storagedCart);
    // }
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    prevCartRef.current = cart
  })

  const cartPreviousValue = prevCartRef.current ?? cart

  useEffect(() => {
    if(cartPreviousValue !== cart){
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      // TODO
      // Cria novo array de Cart respeitando imutabilidade do react
      const updatedCart = [...cart];

      // Verifica existência do produto pelo id
      const productExists = updatedCart.find(product => product.id === productId);

      // Pega id da api stock
      const stock = await api.get(`/stock/${productId}`);

      // Pega amount do stock
      const stockAmount = stock.data.amount;

      // Se existe produto, pega o amount senão retorna 0
      const currentAmount = productExists ? productExists.amount : 0;

      // Quantidade desejada
      const amount = currentAmount + 1;

      // Verifica se quantidade desejada é maior que estoque
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');        
        return;
      }

      // Verifica se produto existe e atualiza a quantidade
      if(productExists){
        productExists.amount = amount;        
      }
      else{
        // Se produto não existe é adicionado um novo produto
        const product = await api.get(`/products/${productId}`)

        // Pega todos os dados da api Product e cria amount com valor 1
        const newProduct = {
          ...product.data,
          amount: 1
        }
        // Adiciona as alterações
        updatedCart.push(newProduct);        
      }
      // Salva no estado e localStorage
      setCart(updatedCart);
      //localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));      
      
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => product.id === productId)

      if(productIndex >= 0){
        updatedCart.splice(productIndex, 1)
        setCart(updatedCart)
        //localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else {
        throw Error();
      }
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      if (amount <= 0) {
        return
      }

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount

      if (amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');        
        return;
      }

      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId)

      if (productExists){
        productExists.amount = amount;
        setCart(updatedCart)
        //localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
