// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. BoxedWine Shell が参照する DOM 要素群を全生成して document.body 直下に確定配置
    if (!document.getElementById("canvas")) {
        document.body.style.backgroundColor = "#1a1a1a";
        document.body.style.margin = "0";
        document.body.style.color = "#fff";
        document.body.style.fontFamily = "sans-serif";

        const container = document.createElement("div");
        container.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;";

        // 必須 UI 要素
        const status = document.createElement("div");
        status.id = "status";
        status.innerText = "Downloading files...";
        status.style.cssText = "margin-bottom: 10px; font-weight: bold;";

        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = "background-color: #000; border: 1px solid #555;";
        canvas.oncontextmenu = (e) => e.preventDefault();

        // boxedwine-shell.js が参照する可能性のある ID 要素を全てダミーとして追加
        const ids = [
            "run-link", "run-button", "startBtn", "soundToggle", 
            "items", "fullscreen", "btnConsole", "output", "upload", "zip-input"
        ];
        ids.forEach(id => {
            if (!document.getElementById(id)) {
                const elem = (id === "soundToggle" || id === "zip-input") 
                    ? document.createElement("input") 
                    : (id === "items" ? document.createElement("select") : document.createElement("button"));
                elem.id = id;
                elem.style.display = "none";
                container.appendChild(elem);
            }
        });

        container.appendChild(status);
        container.appendChild(canvas);
        document.body.appendChild(container);
    }

    // 2. CSSのロード
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `${baseURL}/SingleThreaded/boxedwine.css`;
    document.head.appendChild(cssLink);

    // 3. 分割ZIPファイルの取得と結合
    console.log("[BoxedWine] 分割アーカイブの取得を開始します...");

    const partFiles = [
        `${baseURL}/Wine11/boxedwine.zip.part001`,
        `${baseURL}/Wine11/boxedwine.zip.part002`,
        `${baseURL}/Wine11/boxedwine.zip.part003`
    ];

    try {
        const responses = await Promise.all(
            partFiles.map(async (url) => {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`ファイルの取得に失敗しました: ${url}`);
                console.log(`[Loaded] ${url}`);
                return res.arrayBuffer();
            })
        );

        console.log("[BoxedWine] 分割ファイルを結合中...");
        const mergedZipBlob = new Blob(responses, { type: "application/zip" });
        const zipBlobURL = URL.createObjectURL(mergedZipBlob);

        console.log("[BoxedWine] 結合完了。");

        const canvasElem = document.getElementById("canvas");
        const statusElem = document.getElementById("status");

        // 4. Config / Module の全般定義
        const moduleConfig = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            canvas: canvasElem,
            // 起動時に自動実行するコマンド引数をセットアップ
            arguments: ["wine", "explorer", "/desktop=wine,800x600"],
            setStatus: (text) => {
                if (statusElem && text) statusElem.innerText = text;
            },
            print: (text) => console.log("[BoxedWine Out]", text),
            printErr: (text) => console.warn("[BoxedWine Err]", text),
            
            // Emscripten の準備完了フック
            noInitialRun: false
        };

        window.Config = moduleConfig;
        window.Module = moduleConfig;

        // 5. スクリプト読込用ヘルパー
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // スクリプトのロード（shell の準備を確実に終えてから main へ）
        await loadScript(`${baseURL}/SingleThreaded/boxedwine-shell.js`);
        
        // shell 側が要求する関数の呼び出しチェック（定義されている場合）
        if (typeof window.startWith === "function") {
            window.startWith(zipBlobURL);
        } else {
            await loadScript(`${baseURL}/SingleThreaded/boxedwine.js`);
        }

        console.log("[BoxedWine] 正常に起動シーケンスが完了しました。");

    } catch (err) {
        console.error("[BoxedWine ERROR]", err);
    }
})();
