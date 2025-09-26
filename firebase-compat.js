// Firebase mock simple
if (!window.firebase) {
    window.firebase = {
        apps: [],
        initializeApp: () => ({ name: 'mock' }),
        database: () => ({
            ref: () => ({
                set: () => Promise.resolve(),
                once: () => Promise.resolve({ val: () => null }),
                on: () => {}
            })
        })
    };
}