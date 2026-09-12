// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. BoxedWine Shell が求める完全な UI 構造を生成
    if (!document.getElementById("canvas")) {
        document.body.style.backgroundColor = "#1a1a1a";
        document.body.style.margin = "0";
        document.body.style.color = "#fff";
        document.body.style.fontFamily = "sans-serif";

        const container = document.createElement("div");
        container.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 10px; box-sizing: border-box;";

        // ヘッダー・操作パネル
        const controls = document.createElement("div");
        controls.style.cssText = "margin-bottom: 10px; display: flex; gap: 10px; align-items: center;";

        // shell.js が addEventListener を試みる可能性のある標準要素を配置
        const runBtn = document.createElement("button");
        runBtn.id = "run-button";
        runBtn.style.display = "none";

        const startBtn = document.createElement("button");
        startBtn.id = "startBtn";
        startBtn.style.display = "none";

        const soundCheck = document.createElement("input");
        soundCheck.type = "checkbox";
        soundCheck.id = "soundToggle";
        soundCheck.style.display = "none";

        // ステータス表示
        const status = document.createElement("div");
        status.id = "status";
        status.innerText = "Downloading archive...";
        status.style.cssText = "font-weight: bold; font-size: 14px;";

        // Canvas描画エリア
        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = "background-color: #000; border: 1px solid #555; max-width: 100%; height: auto;";
        canvas.oncontextmenu = (e) => e.preventDefault();

        // ログ出力用テキストエリア
        const output = document.createElement("textarea");
        output.id = "output";
        output.rows = 6;
        output.style.cssText = "width: 800px; max-width: 100%; margin-top: 10px; background: #000; color: #0f0; border: 1px solid #444; font-family: monospace; display: none;";

        controls.appendChild(status);
        controls.appendChild(runBtn);
        controls.appendChild(startBtn);
        controls.appendChild(soundCheck);

        container.appendChild(controls);
        container.appendChild(canvas);
        container.appendChild(output);
        document.body.appendChild(container);
    }

    // 2. CSSの動的読み込み
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

        // 4. Config 設定 (arguments の見直し)
        const configObj = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            // 汎用的なWine環境起動のための引数構成 (必要に応じて変更可能)
            arguments: ["wine", "explorer", "/desktop=wine,800x600"],
            canvas: canvasElem,
            setStatus: (text) => {
                if (statusElem) statusElem.innerText = text;
            },
            print: (text) => console.log("[BoxedWine Out]", text),
            printErr: (text) => console.warn("[BoxedWine Err]", text)
        };

        window.Config = configObj;
        window.Module = configObj;

        // 5. スクリプトの順次ロード
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        await loadScript(`${baseURL}/SingleThreaded/boxedwine-shell.js`);
        await loadScript(`${baseURL}/SingleThreaded/boxedwine.js`);

        console.log("[BoxedWine] 正常に起動シーケンスが完了しました。");

    } catch (err) {
        console.error("[BoxedWine ERROR]", err);
    }
})();
