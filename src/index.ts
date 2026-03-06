import express, { Request, response, Response } from 'express';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; 

// 2. ИНИЦИАЛИЗАЦИЯ EXPRESS
// Подсказка: Вызови функцию express(), чтобы создать сервер, и сохрани в константу app
const app = express();
const PORT = 3000;

// Подсказка: Научи свой app понимать JSON-формат (используй метод use и express.json())
app.use(express.json());
app.use(express.static('public'));
// 3. ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ (Специфика Prisma 7)
const connectionString = process.env.DATABASE_URL;
// Подсказка: Создай новый Pool, передав ему объект с connectionString
const pool = new Pool({connectionString});
// Подсказка: Создай адаптер PrismaPg, передав ему твой pool
const adapter = new PrismaPg(pool);
// Подсказка: Создай PrismaClient и передай ему объект с адаптером
const prisma = new PrismaClient({adapter});

// 4. НАШ ПЕРВЫЙ МАРШРУТ (GET-запрос для получения товаров)
// Подсказка: Вызови метод get у app. Укажи путь '/api/products'.
app.get('/api/products', async (req: Request, res: Response) => {
    try {
        const {status, search, sort} = req.query;
        // Подсказка: Обратись к prisma, выбери модель product и вызови метод findMany()
        // Не забудь использовать await, так как база отвечает не мгновенно!
        // const products = await fetch ('prisma', findMany());
        const products = await prisma.product.findMany({
            where: {
                status: status ? (status as ProductStatus) : undefined,
                name: search ? {
                    contains: String(search),
                    mode: 'insensitive'
                } : undefined
            },
            include: { category: true },
            orderBy: {
                price: sort === 'desc' ? 'desc' : 'asc'
            }
        });
        
        // Подсказка: Отправь полученные products обратно клиенту в формате JSON
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/products/:id', async (req: Request, res: Response) =>{
    try {
        //req.params.id;
        //const.productid = await prisma.product.findUnique();
        //if (response.null) { return (res.status(404).json({ error: "Товар не найден" }))}
        
        // 1. Достаем ID из адреса и превращаем его в число
        const productId = Number(req.params.id);
        // 2. Ищем в базе конкретный товар
        const product = await prisma.product.findUnique({
            where: { id: productId } // Говорим: "ищи там, где id совпадает"
        });
        // 3. Проверяем, нашли ли мы что-нибудь
        if (!product) {
            // Если товара нет (null), отправляем 404
            return res.status(404).json({ error: "Товар не найден" });
        }
        // 4. Если нашли — отправляем товар клиенту
        res.json(product);

    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });

    }
});

app.patch('/api/products/:id', async (req, res) => {
    try{
        const productId = Number(req.params.id);
        const { price } = req.body;
        const updatedProduct = await prisma.product.update({
            where: {id:productId},
            data: {price: Number(price)}
        });
        res.json(updatedProduct);
    }catch(error){
        res.status(500).json({error: 'Ошибка обновления'});

    }
});

app.delete('/api/products/:id', async (req: Request, res: Response)=>{
    try {
        const productId = Number(req.params.id);
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            return res.status(404).json({error: "Ошибка удаления"});
        }
        await prisma.product.delete({ where: {id:productId}});
        
        res.json({message: "Товар удален"});
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера'});
    }
});

app.post('/api/products', async (req: Request, res: Response) => {
    try {
        // 1. Достаем из запроса еще и categoryId
        const { name, price, categoryId, status } = req.body; 
        
        const newProduct = await prisma.product.create({
            data: {
                name: name,
                price: Number(price),
                // 2. Обязательно передаем его в Присму!
                categoryId: Number(categoryId),
                status: status || ProductStatus.IN_STOCK
            }
        });
        
        res.json(newProduct);
    } catch (error) {
        console.error("Ошибка при создании товара", error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/categories', async (req: Request, res: Response) => {
   try{ 
    const {name} = req.body;
    const newCategory = await prisma.category.create({
        data: {name: name}
    });
    res.json(newCategory);
   }catch (error) {
    res.status(500).json({error: 'Ошибка сервера'});
   }
});

// 5. ЗАПУСК СЕРВЕРА
// Подсказка: Заставь app слушать (listen) твой PORT
app.listen(PORT, () => {
    console.log(`Магазин гаджетов работает на http://localhost:${PORT}`);
});