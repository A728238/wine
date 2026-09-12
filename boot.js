// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. BoxedWineに必要なDOM要素群を一括生成
    if (!document.getElementById("canvas")) {
        document.body.style.backgroundColor = "#111";
        document.body.style.margin = "0";
        document.body.style.color = "#fff";
        document.body.style.fontFamily = "sans-serif";

        const wrapper = document.createElement("div");
        wrapper.id = "boxedwine-wrapper";
        wrapper.style.cssText = "width: 100vw; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;";

        // ステータス表示部
        const status = document.createElement("div");
        status.id = "status";
        status.innerText = "Downloading & Initializing...";
        status.style.cssText = "margin: 8px; font-weight: bold;";

        // Canvas描画エリア
        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.style.cssText = "width: 800px; height: 600px; background-color: #000; border: 1px solid #444;";
        canvas.oncontextmenu = (e) => e.preventDefault();

        // ログ出力用（非表示）
        const output = document.createElement("textarea");
        output.id = "output";
        output.style.display = "none";

        wrapper.appendChild(status);
        wrapper.appendChild(canvas);
        wrapper.appendChild(output);
        document.body.appendChild(wrapper);
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

        // 4. Config & Module の定義 (両方設定して互換性を確保)
        const canvasElem = document.getElementById("canvas");
        const statusElem = document.getElementById("status");

        const configObj = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            arguments: ["/bin/sh", "/root/run.sh"],
            canvas: canvasElem,
            setStatus: (text) => {
                if (statusElem) statusElem.innerText = text;
            }
        };

        window.Config = configObj;
        window.Module = configObj; // Shellスクリプト側の直接参照に対応

        // 5. スクリプトの動的ロード
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
