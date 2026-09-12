// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. BoxedWine Shell が必須とする標準 UI 要素を生成
    if (!document.getElementById("canvas")) {
        document.body.style.backgroundColor = "#1a1a1a";
        document.body.style.margin = "0";
        document.body.style.color = "#fff";
        document.body.style.fontFamily = "sans-serif";

        const container = document.createElement("div");
        container.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;";

        // Shell 内部で参照・イベント登録される必須要素
        const status = document.createElement("span");
        status.id = "status";
        status.innerText = "Downloading files...";
        status.style.cssText = "margin-bottom: 10px; font-weight: bold;";

        const runLink = document.createElement("a");
        runLink.id = "run-link";
        runLink.style.display = "none";

        const soundCheck = document.createElement("input");
        soundCheck.type = "checkbox";
        soundCheck.id = "soundToggle";
        soundCheck.style.display = "none";

        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = 800;
        canvas.height = 600;
        canvas.style.cssText = "background-color: #000; border: 1px solid #555;";
        canvas.oncontextmenu = (e) => e.preventDefault();

        // ドロップダウンや出力ログ用要素
        const items = document.createElement("select");
        items.id = "items";
        items.style.display = "none";

        const output = document.createElement("textarea");
        output.id = "output";
        output.style.display = "none";

        container.appendChild(status);
        container.appendChild(runLink);
        container.appendChild(soundCheck);
        container.appendChild(items);
        container.appendChild(canvas);
        container.appendChild(output);
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

        console.log("[BoxedWine] 結合完了。Blob URLをセットアップします。");

        // 4. Shell 起動用の構成オブジェクトを設定
        window.Config = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            // 空配列に指定することで、boxedwine.zip 内の標準エントリ（またはShellのデフォルト）を自動判定させます
            arguments: [],
            canvas: document.getElementById("canvas"),
            setStatus: (text) => {
                const statusElem = document.getElementById("status");
                if (statusElem) statusElem.innerText = text;
            },
            print: (text) => console.log("[BoxedWine Out]", text),
            printErr: (text) => console.warn("[BoxedWine Err]", text)
        };

        // 5. スクリプトのロード
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        // Shell 側の準備を完了させるため順次ロード
        await loadScript(`${baseURL}/SingleThreaded/boxedwine-shell.js`);
        await loadScript(`${baseURL}/SingleThreaded/boxedwine.js`);

        console.log("[BoxedWine] 初期化シーケンス完了。");

    } catch (err) {
        console.error("[BoxedWine ERROR]", err);
    }
})();
