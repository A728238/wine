// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. boxedwine-shell.js が参照する可能性のある全 DOM 要素をあらかじめ生成
    if (!document.getElementById("canvas")) {
        document.body.style.backgroundColor = "#111";
        document.body.style.margin = "0";
        document.body.style.color = "#fff";
        document.body.style.fontFamily = "sans-serif";

        const wrapper = document.createElement("div");
        wrapper.id = "boxedwine-wrapper";
        wrapper.style.cssText = "width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;";

        // 必須UI要素群
        const status = document.createElement("div");
        status.id = "status";
        status.innerText = "Downloading & Initializing...";
        status.style.cssText = "margin: 8px; font-weight: bold;";

        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = "background-color: #000; border: 1px solid #444;";
        canvas.oncontextmenu = (e) => e.preventDefault();

        // boxedwine-shell.js がイベントを付与する要素群 (ダミー生成)
        const dummyIDs = [
            "run-link", "run-button", "startBtn", "soundToggle", 
            "items", "fullscreen", "btnConsole", "output", "upload", "zip-input"
        ];

        dummyIDs.forEach(id => {
            if (!document.getElementById(id)) {
                let elem;
                if (id === "soundToggle" || id === "zip-input") {
                    elem = document.createElement("input");
                    elem.type = id === "soundToggle" ? "checkbox" : "file";
                } else if (id === "items") {
                    elem = document.createElement("select");
                } else if (id === "output") {
                    elem = document.createElement("textarea");
                } else {
                    elem = document.createElement("button");
                }
                elem.id = id;
                elem.style.display = "none";
                wrapper.appendChild(elem);
            }
        });

        wrapper.appendChild(status);
        wrapper.appendChild(canvas);
        document.body.appendChild(wrapper);
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

        console.log("[BoxedWine] 結合完了。Blob URL:", zipBlobURL);

        // 4. Config & Module の構築
        const canvasElem = document.getElementById("canvas");
        const statusElem = document.getElementById("status");

        const configObj = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            arguments: ["wine", "explorer", "/desktop=wine,800x600"],
            canvas: canvasElem,
            setStatus: (text) => {
                if (statusElem && text) statusElem.innerText = text;
            },
            print: (text) => console.log("[BoxedWine Out]", text),
            printErr: (text) => console.warn("[BoxedWine Err]", text)
        };

        // グローバルへ紐付け
        window.Config = configObj;
        window.Module = configObj;

        // 5. スクリプトの動的ロード
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // shell のロード完了を待ってから main (boxedwine.js) をロード
        await loadScript(`${baseURL}/SingleThreaded/boxedwine-shell.js`);
        await loadScript(`${baseURL}/SingleThreaded/boxedwine.js`);

        console.log("[BoxedWine] 初期化シーケンス完了。");

    } catch (err) {
        console.error("[BoxedWine ERROR]", err);
    }
})();
