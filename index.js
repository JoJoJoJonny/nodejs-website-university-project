/*--------------------------------------------------------------------------------------------------------------------*/
/*configurations*/

//for express
const express = require('express');
const app = express();

//for database
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

//for ejs
app.set('view engine', 'ejs');
app.set('views', './views');

//parser for form (should be default inside express)
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

//for session
const session = require('express-session');
const {data} = require("express-session/session/cookie");
app.use(session({
    secret: 'segreto',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false},
}))

//static route (for boostrap, img and css)
app.use(express.static('public'));

//for json
app.use(express.json());

//for hashing
const bcrypt = require('bcrypt');

//helmet is used for security (must be configurated, so i'll try later)
/*
const helmet = require('helmet');
app.use(helmet());
*/


/*multer (for managing the propic)*/
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'public', 'uploads', 'profile_pics');

// crea la cartella se non esiste (solo una volta)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // cartella di destinazione
    },
    filename: function (req, file, cb) {
        // prendo estensione file originale
        const ext = path.extname(file.originalname);

        // creo nome file unico basato sull'email
        const baseFileName = req.session.email.replace(/[@.]/g, '_') + '_propic';

        cb(null, baseFileName + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, JPG, and WEBP images are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});


/*--------------------------------------------------------------------------------------------------------------------*/
/*database init function*/
let db;

(async () => {
    try {
        db = await sqlite.open({
            filename: './token.db',
            driver: sqlite3.Database
        });

        await db.exec("PRAGMA foreign_keys = ON");//needed to use the foreign key

        //students table
        await db.exec(`CREATE TABLE IF NOT EXISTS students
                       (
                           email    TEXT CHECK (instr(email, '@') > 1),
                           password TEXT              NOT NULL CHECK (length(password) >= 8),
                           name     TEXT              NOT NULL,
                           surname  TEXT              NOT NULL,
                           class    TEXT              NOT NULL,
                           nTokens  INTEGER DEFAULT 0 NOT NULL CHECK (nTokens >= 0),
                           propic   TEXT,
                           PRIMARY KEY (email)
                       )`);

        //professors table
        await db.exec(`CREATE TABLE IF NOT EXISTS professors
                       (
                           email    TEXT PRIMARY KEY CHECK (instr(email, '@') > 1),
                           password TEXT NOT NULL CHECK (length(password) >= 8),
                           name     TEXT NOT NULL,
                           surname  TEXT NOT NULL,
                           propic   TEXT
                       )`);

        //classes table
        await db.exec(`CREATE TABLE IF NOT EXISTS classes
                       (
                           section   TEXT,
                           profEmail TEXT CHECK (instr(profEmail, '@') > 1), --return the position of the @ character
                           subject   TEXT,
                           PRIMARY KEY (section, profEmail, subject),
                           FOREIGN KEY (profEmail) REFERENCES professors (email)
                       )`);

        //transactions table
        await db.exec(`CREATE TABLE IF NOT EXISTS transactions
                       (
                           id       INTEGER PRIMARY KEY AUTOINCREMENT,
                           sender   TEXT REFERENCES students (email), --chiave esterna
                           receiver TEXT REFERENCES students (email), --chiave esterna
                           nTokens  INTEGER NOT NULL CHECK (nTokens >= 0),
                           date     DATETIME DEFAULT CURRENT_TIMESTAMP
                       )`);

        //generations table
        await db.exec(`CREATE TABLE IF NOT EXISTS generations
                       (
                           id       INTEGER PRIMARY KEY AUTOINCREMENT,
                           sender   TEXT REFERENCES professors (email), --chiave esterna
                           receiver TEXT REFERENCES students (email),   --chiave esterna
                           nTokens  INTEGER NOT NULL,
                           date     DATETIME DEFAULT CURRENT_TIMESTAMP
                       )`);
        console.log("Database successfully initialized!");
    }catch(err){
        console.error("Error while Database Init: " + err);
    }
})();



/*--------------------------------------------------------------------------------------------------------------------*/
/*middleware*/

function isAuthenticated (req, res, next) {
    if(req.session.isAuthenticated) {
        next();
    }
    else{
        res.redirect('/');
    }
}

function isNotAuthenticated (req, res, next) { //i need this in case someone tries to log with another account while already logged
    if(!req.session.isAuthenticated) {
        next();
    }
    else{
        res.redirect(`/dashboard/${req.session.role}`);
    }
}

function isProfessor (req, res, next) {
    if(req.session.role === 'prof') {
        next();
    }
    else{
        res.redirect('/');
    }
}

function isStudent (req, res, next) {
    if(req.session.role === 'stud') {
        next();
    }
    else{
        res.redirect('/');
    }
}

/*--------------------------------------------------------------------------------------------------------------------*/
/*starting, homepage, logout endpoint*/

app.get('/', isNotAuthenticated, (req, res) => {
    res.redirect('/homepage');
})

app.get('/homepage', isNotAuthenticated, (req, res) => {
    res.render('homepage');
})

/*endpoint for logout*/
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.redirect('/');
})


/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for testing*/
/*
app.get('/prova', (req, res) => {
    res.render('provaVisibility');
})
*/


/*----------------------------------------------------------------------------------------------------------------------*/
/*register endpoint*/

app.get('/register/:role', isNotAuthenticated, (req, res) => {
    const {role} = req.params;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');
    res.render('register', {role});
})

app.post('/register/:role', async(req, res) => {
    const {role} = req.params;

    //get the data from the form
    const {email, password, name, surname, studClass} = req.body;

    //if something missing return to the form
    if(email === '' || password === '' || name === '' || surname === '' || studClass === '') {
        return res.render('register', {role, error: 'Every Field is Required!'});
    }

    //check the mail format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.render('register', {role, error: 'Invalid Email Format!'});
    }

    //check password length and format
    if (password.length < 8) {
        return res.render('register', {role, error: 'Password must be at least 8 characters long!'});
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if(!passwordRegex.test(password)) {
        return res.render('register', {role, error: 'Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character!'});
    }
    //(?=.*[a-z])             almeno una minuscola
    //(?=.*[A-Z])             almeno una maiuscola
    //(?=.*\d)                almeno un numero
    //(?=.*[\W_])             almeno un simbolo (non alfanumerico)
    //.{8,}                   almeno 8 caratteri in totale

    //check if the class exists (if student)
    if (role === 'stud') {
        const classExists = await db.get("SELECT 1 FROM classes WHERE section = ?", studClass);
        if (!classExists) {
            return res.render('register', { role, error: 'Class Not Found!' });
        }
    }

    //select the correct table based on role
    const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;
    if(!table)
        return res.status(401).send('Role Not Valid');

    try {
        //get the data from the database
        const user = await db.get(`SELECT *
                                   FROM ${table}
                                   WHERE email = ?`, email);

        //check if the email is already used
        if (user) {
            return res.render('register', {role, error: 'Email Already Used!'});
        }

        //hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        //add the new user
        if (role === 'stud') {
            await db.run(`INSERT INTO students (email, password, name, surname, class)
                          VALUES (?, ?, ?, ?, ?)`,
                [email, hashedPassword, name, surname, studClass]);
        }
        if (role === 'prof') {
            await db.run(`INSERT INTO professors (email, password, name, surname)
                          VALUES (?, ?, ?, ?)`,
                [email, hashedPassword, name, surname]);
        }
    }catch (err) {
        console.error("Error in /register: " + err);
        return res.render('register', { role, error: 'Internal Error!' });
    }
    return res.redirect(`/login/${role}`);
})

/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for login*/

app.get('/login/:role', isNotAuthenticated, (req, res) => {
    const {role} = req.params;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');
    res.render('login', {role: role});
})

app.post('/login/:role', async(req, res) => {
    const {role} = req.params;

    //get the data from the form
    const {email, password} = req.body;

    //if email or password missing return to the form
    if(email === '' || password === '') {
        return res.render('login', {role, error: 'Email or Password Missing!'});
    }

    //select the correct table based on role
    const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;
    if(!table)
        return res.status(401).send('Role not valid');

    try {
        //get the data from the database
        const user = await db.get(`SELECT *
                                   FROM ${table}
                                   WHERE email = ?`, email);

        //check if user exists
        if (!user) {
            return res.render('login', {role, error: 'User not found!'});
        }

        //check hashed password
        const match = await bcrypt.compare(password, user.password);

        if(match){
            req.session.email = email;
            req.session.role = role;
            req.session.isAuthenticated = true;
            return res.redirect(`/dashboard/${role}`);
        }else{
            return res.render('login', {role, error: 'Wrong Password!'});
        }
    }catch (err) {
        console.error("Error in /login: " + err);
        return res.render('login', {role, error: 'Internal Error!'});
    }
})

/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for profile*/
/*i don't use it anymore, now i have fetch call inside the dashboard page*/
/*
app.get('/profile/:role', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');
    //take user data
    const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;
    const user = await db.get(`SELECT * FROM ${table} WHERE email = ?`, req.session.email);

    if(role === 'stud'){
        res.render(`profile_stud`, {role, user});
    }
    if(role === 'prof'){
        const classes = await db.all(`SELECT section, subject FROM classes WHERE profEmail = ?`, req.session.email);
        res.render(`profile_prof`, {role, user, classes});
    }

})

app.get('/dashboard/prof', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');

    res.render(`dashboard_prof`, {role});
})

app.get('/dashboard/stud', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');

    res.render(`dashboard_stud`, {role});
})
*/


/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for dashboards*/

app.get('/dashboard/:role', isAuthenticated, async (req, res) => {
    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');

    try {
        //take user data (need this for the propic)
        const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;
        const user = await db.get(`SELECT *
                                   FROM ${table}
                                   WHERE email = ?`, req.session.email);
        res.render(`dashboard_${role}`, {role, user});
    }catch(err){
        console.error("Error in /dashboard: " + err);
    }
})



/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for classes*/
/*i don't use this anymore, i have fetch call now*/

/*
app.post('/add_class', isAuthenticated, isProfessor, async (req, res) => {
    const {section, subject} = req.body;
    const email = req.session.email;

    db.run(`INSERT INTO classes (section, profEmail, subject) 
            VALUES (?, ?, ?)`,
            [section, email , subject]);

    res.redirect(`/dashboard/prof`);
})

app.get('/classes', isAuthenticated, isProfessor, async (req, res) => {
    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');

    //get year and suject of the professor
    const sections = await db.all(`SELECT DISTINCT section FROM classes WHERE (profEmail = ?) ORDER BY section`,[req.session.email]);
    const subjects = await db.all(`SELECT DISTINCT subject FROM classes WHERE (profEmail = ?) ORDER BY subject`,[req.session.email]);

    res.render('classes', {role, sections, subjects});
})

app.post('/classes', isAuthenticated, isProfessor, async (req, res) => {
    const role = req.session.role;
    const {section, subject} = req.body;
    if(role !== 'stud' && role !== 'prof')
        return res.status(401).send('Role not valid');

    const sections = await db.all(`SELECT DISTINCT section FROM classes WHERE (profEmail = ?) ORDER BY section`,[req.session.email]);
    const subjects = await db.all(`SELECT DISTINCT subject FROM classes WHERE (profEmail = ?) ORDER BY subject`,[req.session.email]);

    let students;
    if(subject == 'all'){
        students = await db.all(`SELECT * FROM students WHERE class = ?`,[section]);
    }
    else{
        students = await db.all('SELECT * FROM students WHERE class IN (SELECT class FROM classes WHERE section = ? AND subject = ?)',[section, subject]);
    }

    res.render('classes', {role, sections, subjects, students})
})
*/


/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoint for tokens*/
/*i don't use this anymore, i have fetch calls now*/

/*
app.get('/give_tokens', isAuthenticated, isProfessor, (req, res) => {
    res.render('give_tokens', {role: req.session.role});
})

app.post('/give_tokens', isAuthenticated, isProfessor, async(req, res) => {
    const {receiver, amount} = req.body;

    const student = await db.get(`SELECT * FROM students WHERE email = ?`, receiver);

    if(!student){
        res.status(401).render('give_tokens', {error: 'Wrong Email!'});
    }

    //add the tickets to the student
    db.run(`UPDATE students SET nTokens = nTokens + ? WHERE email = ?`,[amount, receiver]);

    //add a transaction
    db.run(`INSERT INTO generations (sender, receiver, nTokens) VALUES (?, ?, ?)`,[req.session.email, receiver, amount]);

    res.render(`give_tokens`,  {role: req.session.role});
})
*/

/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoints for API prof*/

//old version
/*
app.get('/api/classes', async(req, res) => {
    const classes = await db.all(`SELECT DISTINCT section, subject FROM classes WHERE (profEmail = ?)`,[req.session.email]);

    const data = [];
    for(const cls of classes){
        const students = await db.all(`SELECT email, name, surname, nTokens FROM students WHERE class = ?`,[cls.section]);

        data.push({
            section: cls.section,
            subject: cls.subject,
            students: students
        });
    }

    res.json({data});
})
*/

app.get('/api/classes', isAuthenticated, isProfessor, async(req, res) => {
    try {
        //retrieve all section-subject couple
        const rawClasses = await db.all(`
            SELECT section, subject
            FROM classes
            WHERE profEmail = ?
        `, [req.session.email]);

        //group for section
        const sectionMap = {};

        for (const cls of rawClasses) {
            if (!sectionMap[cls.section]) {
                sectionMap[cls.section] = {
                    section: cls.section,
                    subjects: new Set()
                };
            }
            sectionMap[cls.section].subjects.add(cls.subject);
        }

        const data = [];

        for (const sectionKey in sectionMap) {
            const section = sectionMap[sectionKey];
            const students = await db.all(`
                SELECT *
                FROM students
                WHERE class = ?
                ORDER BY nTokens DESC
            `, [section.section]);

            data.push({
                section: section.section,
                subject: Array.from(section.subjects).join(', '),
                students
            });
        }

        res.json({data});
    }catch(err){
        console.error("Error in /api/classes: " + err);
    }
});


app.post('/api/add_class', isAuthenticated, isProfessor , async(req, res) => {
    const { section, subject } = req.body;

    if (!section || !subject) {
        return res.status(400).json({ error: 'Missin Data!' });
    }

    try {
        const classes = await db.all(`SELECT *
                                      FROM classes
                                      WHERE profEmail = ?`, [req.session.email]);

        //a quanto pare il forEach non funziona come pensassi.
        //non posso scrivero in questo modo in quanto non interrompe il flusso di controllo
        /*
        classes.forEach( c => {
            if(c.section === section && c.subject === subject) {
                return res.status(400).json({error: 'Class already exists!'});
            }
        });
        */

        const alreadyExists = classes.some(c => c.section === section && c.subject === subject);
        if (alreadyExists) {
            return res.status(400).json({error: 'Class already exists!'});
        }

        await db.run(
            `INSERT INTO classes (section, profEmail, subject)
             VALUES (?, ?, ?)`,
            [section, req.session.email, subject]
        );

        return res.status(200).json({success: true});
    }catch (err) {
        console.error("Error in /api/add_class: " + err);
        return res.status(500).json({error: 'Internal Error!'});
    }
})



app.post('/api/prof/give_tokens',isAuthenticated, isProfessor, async(req, res) => {
    const {target, amount} = req.body;

    if(!target || !amount || isNaN(amount)) {
        return res.status(400).json({error: 'Data not valid!'});
    }

    if(amount<=0){
        return res.status(400).json({error: 'Amount must be a positive integer!'});
    }

    try {
        const student = await db.get("SELECT * FROM students WHERE email = ?", [target]);
        if (!student) {
            return res.status(404).json({error: 'Target Email not found!'});
        }

        //add the tickets to the student
        await db.run(`UPDATE students
                      SET nTokens = nTokens + ?
                      WHERE email = ?`, [amount, target]);

        //add a transaction
        await db.run(`INSERT INTO generations (sender, receiver, nTokens)
                      VALUES (?, ?, ?)`, [req.session.email, target, amount]);

        res.json({success: true});
    }catch (err) {
        console.error("Error in /api/prof/give_tokens: " + err);
        return res.status(500).json({error: 'Internal Error!'});
    }
})

app.post('/api/prof/take_tokens', isAuthenticated, isProfessor, async(req, res) => {
    const {target, amount} = req.body;

    if(!target || !amount || isNaN(amount)) {
        return res.status(400).json({error: 'Data not valid!'});
    }

    if(amount<=0){
        return res.status(400).json({error: 'Amount must be a positive integer!'});
    }

    try {
        const student = await db.get("SELECT * FROM students WHERE email = ?", [target]);
        if (!student) {
            return res.status(404).json({error: 'Target Email not found!'});
        }

        if (student.nTokens - amount < 0) {
            return res.status(400).json({error: "Target doesn't have enough tokens"});
        }

        //add the tickets to the student
        await db.run(`UPDATE students
                      SET nTokens = nTokens - ?
                      WHERE email = ?`, [amount, target]);

        //add a transaction
        await db.run(`INSERT INTO generations (sender, receiver, nTokens)
                      VALUES (?, ?, ?)`, [req.session.email, target, -amount]);

        res.json({success: true});
    }catch(err){
        console.error("Error in /api/prof/take_tokens: " + err);
        return res.status(500).json({error: 'Internal Error!'});
    }
})




app.get('/api/generations', isAuthenticated, isProfessor, async(req, res) => {
    try {
        const generations = await db.all("SELECT * FROM generations WHERE sender = ? ORDER BY date DESC", [req.session.email]);
        res.json({generations});
    }catch (err) {
        console.error("Error in /api/generations: " + err);
    }
})


/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoints for API stud*/

app.get('/api/leaderboard', isAuthenticated, isStudent, async(req, res) => {
    try {
        const email = req.session.email;
        const user = await db.get("SELECT * FROM students WHERE email = ?", [req.session.email]);
        const students = await db.all("SELECT * FROM students WHERE class = ? ORDER BY nTokens DESC", [user.class]);
        res.json({students});
    }catch (err) {
        console.error("Error in /api/leaderboard: " + err);
    }
})

app.post('/api/stud/give_tokens',isAuthenticated, isStudent, async(req, res) => {
    const {target, amount} = req.body;

    if(!target || !amount || isNaN(amount)) {
        return res.status(400).json({error: 'Data not valid!'});
    }

    if(amount<=0){
        return res.status(400).json({error: 'Amount must be a positive integer!'});
    }

    try {
        const student = await db.get("SELECT * FROM students WHERE email = ?", [req.session.email]);

        if (student.nTokens < amount) {
            return res.status(400).json({error: `Not enough Tokens! You only have ${student.nTokens}!`});
        }

        const studentTarget = await db.get("SELECT * FROM students WHERE email = ?", [target]);

        if (!studentTarget) {
            return res.status(404).json({error: 'Target Email not found!'});
        }

        //add the tokens to the target
        await db.run(`UPDATE students
                      SET nTokens = nTokens + ?
                      WHERE email = ?`, [amount, target]);
        //remove the tokens to the student
        await db.run(`UPDATE students
                      SET nTokens = nTokens - ?
                      WHERE email = ?`, [amount, req.session.email]);

        //add a transaction
        await db.run(`INSERT INTO transactions (sender, receiver, nTokens)
                      VALUES (?, ?, ?)`, [req.session.email, target, amount]);

        res.json({success: true});
    }catch(err){
        console.error("Error in /api/stud/give_tokens: " + err);
        return res.status(500).json({error: 'Internal Error!'});
    }

})

app.get('/api/transactions', isAuthenticated, isStudent, async(req, res) => {
    try {
        const transactions = await db.all("SELECT * FROM transactions WHERE sender = ? OR receiver = ? ORDER BY date DESC", [req.session.email, req.session.email]);
        const generations = await db.all("SELECT * FROM generations WHERE receiver = ? ORDER BY date DESC", [req.session.email]);
        const user = await db.get("SELECT * FROM students WHERE email = ?", [req.session.email]);
        res.json({transactions, generations, user});
    }catch(err){
        console.error("Error in /api/transactions: " + err);
    }
})

/*--------------------------------------------------------------------------------------------------------------------*/
/*endpoints for API that works with both stud and prof*/
app.get('/api/profile/:role', isAuthenticated, async(req, res) => {
    const role = req.session.role;

    const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;
    if(!table)
        return res.status(401).send('Role Not Valid');

    //take user and classes data
    try{
        const user = await db.get(`SELECT * FROM ${table} WHERE email = ?`, req.session.email);
        if(!user) //smth went REALLY wrong if this is true
            res.redirect(`/logout`);

        if(role==="prof"){
            const classes = await db.all(`SELECT section, subject FROM classes WHERE profEmail = ? ORDER BY section`, req.session.email);
            res.json({role, user, classes});
        } else if(role==="stud"){
            res.json({role, user});
        }
    }catch(err){
        console.error(`/api/profile/${role}`+err);
        res.status(500).json({error: 'Internal Error!'});
    }
})

app.post('/api/change_user_info', isAuthenticated, async(req, res) => {
    const { field, value, password } = req.body;

    const role = req.session.role;
    if(role !== 'stud' && role !== 'prof')
        return res.status(403).send('Role not valid!');
    const table = role === 'stud' ? 'students' : role === 'prof' ? 'professors' : null;

    if (!field || !value || !password) {
        return res.status(400).json({ error: 'Missin Data!' });
    }

    try {
        // ottieni l'utente attuale dalla sessione
        const user = await db.get(`SELECT *
                                   FROM ${table}
                                   WHERE email = ?`, [req.session.email]);
        if (!user) {
            return res.status(401).json({error: "User Not Found!"});
        }

        //if u need to change the new password, u need to check for format
        if (field === "password") {
            if (value.length < 8) {
                return res.status(401).json({error: "Password must be at least 8 characters long!"});
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(value)) {
                return res.status(401).json({error: "Password must be at least 8 characters long, and include at least one uppercase letter, one lowercase letter, one number, and one special character!"});
            }
        }

        // verifica password
        const match = bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(403).json({error: "Wrong Password!"});
        }

        // mapping campi ammessi
        let allowedFields;
        if (role === 'prof') {
            allowedFields = {
                name: 'name',
                surname: 'surname',
                password: 'password'
            };
        } else if (role === 'stud') {
            allowedFields = {
                name: 'name',
                surname: 'surname',
                password: 'password',
                class: 'class'
            };
        } else {
            return res.status(403).json({error: "Wrong Password!"});
        }
        if (!allowedFields[field]) {
            return res.status(400).json({error: "Field not valid!"});
        }

        // esegui l'aggiornamento
        await db.run(`UPDATE ${table}
                      SET ${allowedFields[field]} = ?
                      WHERE email = ?`, [value, req.session.email]);

        res.json({success: true});
    }catch(err){
        console.error("Error in /api/change_user_info", err);
        return res.status(500).json({error: "Internal Error!"});
    }
});

//different endpoint for the propic
app.post('/api/change_user_info/propic', isAuthenticated, (req, res, next) => {
    //to capture exceptions
    upload.single('newPropic')(req, res, function(err) {
        if (err instanceof multer.MulterError || err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const role = req.session.role;
        if (role !== 'stud' && role !== 'prof') {
            return res.status(403).json({ error: 'Role not valid!' });
        }

        const table = role === 'stud' ? 'students' : 'professors';

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded!' });
        }

        const uploadDir = path.join(__dirname, 'public', 'uploads', 'profile_pics');
        const email = req.session.email;

        // rimuovi immagine vecchia con qualunque estensione
        const oldImages = fs.readdirSync(uploadDir).filter(filename => {
            return filename.startsWith(email + '.');
        });

        oldImages.forEach(file => {
            const oldPath = path.join(uploadDir, file);
            if (oldPath !== req.file.path) {  // evita di cancellare il file appena caricato
                fs.unlinkSync(oldPath);
            }
        });

        // aggiorna la colonna profile_pic nel db
        const profilePicFilename = req.file.filename;
        await db.run(`UPDATE ${table} SET propic = ? WHERE email = ?`, [profilePicFilename, email]);

        res.json({ success: true, filename: profilePicFilename });

    } catch (err) {
        console.error('Error in /api/change_user_info/propic:', err);
        return res.status(500).json({ error: 'Internal Error!' });
    }
});



/*--------------------------------------------------------------------------------------------------------------------*/

app.listen(3000);
console.log('Server started on port 3000!');
