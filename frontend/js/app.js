
(() => {
  const cfg = window.BUSINESSFLOW_CONFIG;
  const $ = (s) => document.querySelector(s);
  const money = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(n) || 0);

  const storeKey = 'businessflow-demo-agreements-v1';
  let agreements = load();
  let activeView = 'overview';
  let walletAddress = '';
  let toastTimer;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storeKey) || '[]');
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(storeKey, JSON.stringify(agreements));
  }

  function id() {
    return 'BF-' + Date.now().toString().slice(-7);
  }

  function short(a) {
    return a ? a.slice(0, 6) + '…' + a.slice(-4) : 'Not connected';
  }

  function notify(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function statusLabel(s) {
    return ({
      draft: 'Draft',
      funded: 'Funds secured',
      evidence: 'Awaiting approval',
      released: 'Released',
      disputed: 'Disputed'
    })[s] || s;
  }

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
  }

  function modal(id, show) {
    const el = document.getElementById(id);
    el.classList.toggle('open', show);
    el.setAttribute('aria-hidden', String(!show));
  }

  function render() {
    const active = agreements.filter(a =>
      ['funded', 'evidence', 'disputed'].includes(a.status)
    );

    const secured = active.reduce(
      (n, a) => n + Number(a.amount), 0
    );

    const released = agreements
      .filter(a => a.status === 'released')
      .reduce((n, a) => n + Number(a.amount), 0);

    $('#stat-secured').textContent = money(secured);
    $('#stat-active').textContent = active.length;
    $('#stat-released').textContent = money(released);

    $('#stat-attention').textContent = agreements.filter(a =>
      ['evidence', 'disputed'].includes(a.status)
    ).length;

    $('#nav-count').textContent = agreements.length;

    let list = agreements.slice().reverse();

    if (activeView === 'activity') {
      list = list.filter(a => a.events?.length);
    }

    $('#list-heading').textContent =
      activeView === 'activity' ? 'Recent activity' :
      activeView === 'agreements' ? 'All agreements' :
      'Recent agreements';

    $('#agreement-list').innerHTML = list.slice(0, 8).map(a => `
      <div class="agreement-row" data-id="${esc(a.id)}">
        <div>
          <div class="agreement-name">${esc(a.title)}</div>
          <span class="agreement-id">${esc(a.id)} · ${esc(a.supplier)}</span>
        </div>
        <div class="agreement-party">
          ${esc(a.milestone).slice(0, 36)}${a.milestone.length > 36 ? '…' : ''}
        </div>
        <div class="amount">${money(a.amount)}</div>
        <span class="status ${esc(a.status)}">${statusLabel(a.status)}</span>
      </div>
    `).join('');

    $('#empty-state').classList.toggle('show', list.length === 0);
    $('#agreement-list').style.display = list.length ? 'block' : 'none';

    $('#page-title').innerHTML =
      activeView === 'overview'
        ? 'Good business runs on trust.<br><em>Great business verifies it.</em>'
        : activeView === 'agreements'
          ? 'Every agreement.<br><em>One clear record.</em>'
          : 'Every action leaves<br><em>a verifiable trail.</em>';

    $('#page-subtitle').textContent =
      activeView === 'overview'
        ? 'Create agreements, secure funds and release payments when the right conditions are met.'
        : activeView === 'agreements'
          ? 'Track commitments, milestones, approvals and settlement status.'
          : 'Review the actions recorded in your local demo workspace.';

    $('#crumb-view').textContent =
      activeView[0].toUpperCase() + activeView.slice(1);

    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === activeView);
    });

    document.querySelectorAll('.agreement-row').forEach(row => {
      row.addEventListener('click', () => openDetail(row.dataset.id));
    });
  }

  function createAgreement(data) {
    const a = {
      id: id(),
      title: data.title,
      supplier: data.supplier,
      amount: Number(data.amount),
      supplierWallet: data.supplierWallet || '',
      verifier: data.verifier || '',
      milestone: data.milestone,
      status: 'draft',
      buyer: walletAddress || 'Demo buyer',
      buyerApproved: false,
      verifierApproved: false,
      disputed: false,
      evidence: '',
      events: [{
        at: new Date().toISOString(),
        label: 'Agreement created'
      }]
    };

    agreements.push(a);
    save();
    render();
    notify('Agreement created in local demo.');
    return a;
  }

  function addEvent(a, label) {
    a.events = a.events || [];
    a.events.push({
      at: new Date().toISOString(),
      label
    });
    save();
  }

  function openDetail(key) {
    const a = agreements.find(x => x.id === key);
    if (!a) return;

    $('#detail-title').textContent = a.title;
    $('#detail-meta').textContent =
      `${a.id} · Created ${new Date(a.events[0].at).toLocaleDateString()}`;

    const actions = [];

    if (a.status === 'draft') {
      actions.push(['Simulate funding', 'fund']);
    }

    if (a.status === 'funded') {
      actions.push(['Submit delivery evidence', 'evidence']);
    }

    if (a.status === 'evidence' && !a.disputed) {
      actions.push(['Buyer approves', 'buyer']);
      actions.push(['Verifier approves', 'verifier']);
      actions.push(['Open dispute', 'dispute']);
    }

    if (
      a.status === 'evidence' &&
      !a.disputed &&
      (a.buyerApproved || a.verifierApproved)
    ) {
      actions.push(['Evaluate & release', 'release']);
    }

    const steps = [
      {
        label: 'Agreement created',
        description: 'The agreement was recorded.',
        done: true
      },
      {
        label: 'Funds secured',
        description: 'Funding stage in the demo workflow.',
        done: ['funded', 'evidence', 'released', 'disputed'].includes(a.status)
      },
      {
        label: 'Evidence submitted',
        description: 'Supplier delivery evidence.',
        done: ['evidence', 'released', 'disputed'].includes(a.status)
      },
      {
        label: 'Payment released',
        description: 'Conditional release decision.',
        done: a.status === 'released'
      }
    ];

    const approvalState = a.disputed
      ? {
          className: 'blocked',
          heading: 'Release blocked',
          message: 'A dispute is open. The release condition cannot pass.'
        }
      : (a.buyerApproved || a.verifierApproved)
        ? {
            className: 'ready',
            heading: 'Approval condition satisfied',
            message: 'At least one authorised approval is recorded. The dispute condition must also remain clear.'
          }
        : {
            className: 'waiting',
            heading: 'Awaiting approval',
            message: 'Buyer or verifier approval is required before release.'
          };

    const disputeNotice = a.disputed
      ? `<div class="dispute-banner">
          <strong>Dispute opened</strong>
          <p>Payment release is blocked until the dispute is resolved.</p>
        </div>`
      : '';

    const eventList = (a.events || []).slice().reverse();

    $('#detail-content').innerHTML = `
      <div class="detail-body">

        ${disputeNotice}

        <div class="detail-section-heading">
          <span>Payment overview</span>
          <span class="detail-reference">${esc(a.id)}</span>
        </div>

        <div class="detail-summary">
          <div class="detail-box payment-primary">
            <small>Agreement value</small>
            <strong>${money(a.amount)}</strong>
          </div>
          <div class="detail-box">
            <small>Current status</small>
            <strong>${statusLabel(a.status)}</strong>
          </div>
          <div class="detail-box">
            <small>Supplier</small>
            <strong>${esc(a.supplier)}</strong>
          </div>
        </div>

        <div class="detail-panel">
          <div class="detail-section-heading">Payment breakdown</div>

          <div class="payment-line">
            <span>Agreement amount</span>
            <strong>${money(a.amount)}</strong>
          </div>

          <div class="payment-line">
            <span>Released amount</span>
            <strong>${a.status === 'released' ? money(a.amount) : money(0)}</strong>
          </div>

          <div class="payment-line payment-total">
            <span>Remaining unreleased</span>
            <strong>${a.status === 'released' ? money(0) : money(a.amount)}</strong>
          </div>

          <p class="detail-footnote">
            Illustrative demo accounting only. This interface does not currently
            hold, transfer or verify actual funds.
          </p>
        </div>

        <div class="detail-section-heading">Milestone progress</div>

        <div class="milestone-timeline">
          ${steps.map((step, index) => `
            <div class="milestone-item ${step.done ? 'completed' : ''}">
              <div class="milestone-marker">
                ${step.done ? '✓' : index + 1}
              </div>
              <div class="milestone-copy">
                <strong>${step.label}</strong>
                <p>${step.description}</p>
              </div>
              <span class="milestone-state">
                ${step.done ? 'Complete' : 'Pending'}
              </span>
            </div>
          `).join('')}
        </div>

        <div class="detail-panel">
          <div class="detail-section-heading">Agreement milestone</div>
          <p>${esc(a.milestone)}</p>
        </div>

        <div class="detail-section-heading">Approval verification</div>

        <div class="approval-grid">
          <div class="approval-card">
            <div class="approval-icon">B</div>
            <div>
              <strong>Buyer approval</strong>
              <span>${a.buyerApproved ? 'Approved' : 'Pending'}</span>
            </div>
            <span class="approval-badge ${a.buyerApproved ? 'approved' : ''}">
              ${a.buyerApproved ? '✓' : '…'}
            </span>
          </div>

          <div class="approval-card">
            <div class="approval-icon">V</div>
            <div>
              <strong>Verifier approval</strong>
              <span>${a.verifierApproved ? 'Approved' : 'Pending'}</span>
            </div>
            <span class="approval-badge ${a.verifierApproved ? 'approved' : ''}">
              ${a.verifierApproved ? '✓' : '…'}
            </span>
          </div>
        </div>

        <div class="policy-result ${approvalState.className}">
          <div class="policy-result-heading">${approvalState.heading}</div>
          <p>${approvalState.message}</p>
          <code>(Buyer approved OR Verifier approved) AND NOT disputed</code>
        </div>

        <div class="detail-panel">
          <div class="detail-section-heading">Delivery evidence</div>
          <div class="evidence-reference">
            ${a.evidence ? esc(a.evidence) : 'No evidence submitted yet'}
          </div>
        </div>

        <div class="detail-actions">
          ${actions.map(([label, action]) => `
            <button
              class="${action === 'release' ? 'primary-btn' : action === 'dispute' ? 'danger-btn' : 'secondary-btn'}"
              data-action="${action}"
              data-id="${esc(a.id)}">
              ${label}
            </button>
          `).join('')}
        </div>

        <div class="detail-section-heading">Activity history</div>

        <div class="activity-timeline">
          ${eventList.map(event => `
            <div class="activity-item">
              <span class="activity-dot"></span>
              <div>
                <strong>${esc(event.label)}</strong>
                <small>${new Date(event.at).toLocaleString()}</small>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;

    $('#detail-content').querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        act(a.id, button.dataset.action);
      });
    });

    modal('detail-modal', true);
  }

  function act(key, action) {
    const a = agreements.find(x => x.id === key);
    if (!a) return;

    if (action === 'fund' && a.status === 'draft') {
      a.status = 'funded';
      addEvent(a, 'Demo escrow funded');
    } else if (action === 'evidence' && a.status === 'funded') {
      a.evidence = 'demo-evidence-' +
        Math.random().toString(16).slice(2, 10);
      a.status = 'evidence';
      addEvent(a, 'Supplier submitted delivery evidence reference');
    } else if (
      action === 'buyer' &&
      a.status === 'evidence' &&
      !a.disputed
    ) {
      a.buyerApproved = true;
      addEvent(a, 'Buyer approval recorded');
    } else if (
      action === 'verifier' &&
      a.status === 'evidence' &&
      !a.disputed
    ) {
      a.verifierApproved = true;
      addEvent(a, 'Verifier approval recorded');
    } else if (
      action === 'dispute' &&
      ['funded', 'evidence'].includes(a.status)
    ) {
      a.disputed = true;
      a.status = 'disputed';
      addEvent(a, 'Dispute opened — release blocked');
    } else if (
      action === 'release' &&
      a.status === 'evidence' &&
      !a.disputed &&
      (a.buyerApproved || a.verifierApproved)
    ) {
      a.status = 'released';
      addEvent(a, 'Demo policy evaluated: release allowed');
    } else {
      notify('That action is not available for this agreement.');
      return;
    }

    save();
    render();
    openDetail(key);

    notify(
      action === 'release'
        ? 'Demo policy passed. Simulated release recorded.'
        : 'Demo action recorded.'
    );
  }

  async function connectWallet() {
    if (!window.ethereum) {
      notify('No injected wallet found. Install MetaMask or OKX Wallet.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      walletAddress = accounts[0] || '';
      $('#connect-wallet').textContent = short(walletAddress);

      notify('Wallet connected. Demo remains local until live contracts are configured.');
    } catch (e) {
      notify(e?.message || 'Wallet connection cancelled.');
    }
  }

  async function switchNetwork() {
    if (!window.ethereum) {
      throw new Error('No injected wallet found.');
    }

    const chainHex = '0x' + Number(cfg.chainId).toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }]
      });
    } catch (e) {
      if (e.code !== 4902) throw e;

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainHex,
          chainName: cfg.chainName,
          nativeCurrency: {
            name: 'OKB',
            symbol: 'OKB',
            decimals: 18
          },
          rpcUrls: [cfg.rpcUrl],
          blockExplorerUrls: [cfg.explorerUrl]
        }]
      });
    }
  }

  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      activeView = button.dataset.view;
      render();
    });
  });

  $('#new-agreement').addEventListener('click', () => {
    modal('agreement-modal', true);
  });

  $('#empty-create').addEventListener('click', () => {
    modal('agreement-modal', true);
  });

  document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
      modal(button.dataset.close, false);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) modal(backdrop.id, false);
    });
  });

  $('#agreement-form').addEventListener('submit', event => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (Number(data.amount) <= 0) {
      notify('Enter an amount greater than zero.');
      return;
    }

    createAgreement(data);
    event.currentTarget.reset();
    modal('agreement-modal', false);
  });

  $('#connect-wallet').addEventListener('click', connectWallet);

  $('#dismiss-notice').addEventListener('click', () => {
    $('#notice').remove();
  });

  $('#circuit-status').textContent =
    'Demo policy preview · not connected to processor';

  if (
    cfg.mode === 'live' &&
    cfg.escrowAddress &&
    cfg.paymentTokenAddress
  ) {
    $('#mode-pill').textContent = 'LIVE CONFIGURED';
    $('#mode-pill').style.color = '#16865d';
    $('#mode-pill').style.background = '#e9f7ef';
  }

  render();

  window.BusinessFlow = {
    switchNetwork,
    config: cfg,
    getAgreements: () => agreements
  };
})();
